// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var fs = require('fs');
var path = require('path');

var ErrorReporter = traceur.util.ErrorReporter;
var InternalLoader = traceur.runtime.internals.InternalLoader;
var ModuleAnalyzer = traceur.semantics.ModuleAnalyzer;
var ModuleDefinition = traceur.syntax.trees.ModuleDefinition;
var ModuleRequireVisitor = traceur.codegeneration.module.ModuleRequireVisitor;
var ModuleSymbol = traceur.semantics.symbols.ModuleSymbol;
var ModuleTransformer = traceur.codegeneration.ModuleTransformer;
var ParseTreeTransformer = traceur.codegeneration.ParseTreeTransformer;
var Parser = traceur.syntax.Parser;
var Program = traceur.syntax.trees.Program;
var ProgramTransformer = traceur.codegeneration.ProgramTransformer;
var Project = traceur.semantics.symbols.Project;
var SourceFile = traceur.syntax.SourceFile
var SourceMapGenerator = traceur.outputgeneration.SourceMapGenerator;
var TreeWriter = traceur.outputgeneration.TreeWriter;

var canonicalizeUrl = traceur.util.canonicalizeUrl;
var createIdentifierExpression = traceur.codegeneration.ParseTreeFactory.createIdentifierExpression;
var createIdentifierToken = traceur.codegeneration.ParseTreeFactory.createIdentifierToken;
var evaluateStringLiteral = traceur.util.evaluateStringLiteral;
var resolveUrl = traceur.util.resolveUrl;

/**
 * Wraps a program in a module definition.
 * @param  {ProgramTree} tree The original program tree.
 * @param  {string} url The relative URL of the module that the program
 *     represents.
 * @param {string} commonPath The base path of all the files. This is passed
 *     along to |generateNameForUrl|.
 * @return {[ProgramTree} A new program tree with only one statement, which is
 *     a module definition.
 */
function wrapProgram(tree, url, commonPath) {
  var name = generateNameForUrl(url, commonPath);
  return new Program(null,
      [new ModuleDefinition(null,
          createIdentifierToken(name), tree.programElements)]);
}

function findCommonPath(paths) {
  function longestPrefix(s1, s2) {
    var length = Math.min(s1.length, s2.length);
    for (var i = 0; i < length; i++) {
      if (s1[i] !== s2[i])
        break;
    }
    return s1.slice(0, i);
  }

  return paths.reduce(longestPrefix, paths[0]);
}

/**
 * Generates an identifier string that represents a URL.
 * @param {string} url
 * @param {string} commonPath
 * @return {string}
 */
function generateNameForUrl(url, commonPath) {
  return '$' + url.replace(commonPath, '').replace(/[^\d\w$]/g, '_');
}

/**
 * This transformer replaces
 *
 *   import * from "url"
 *
 * with
 *
 *   import * from $_name_associated_with_url
 *
 * @param {string} url The base URL that all the modules should be relative
 *     to.
 * @param {string} commonPath The path that is common for all URLs.
 */
function ModuleRequireTransformer(url, commonPath) {
  ParseTreeTransformer.call(this);
  this.url = url;
  this.commonPath = commonPath;
}

ModuleRequireTransformer.prototype = {
  __proto__: ParseTreeTransformer.prototype,
  transformModuleRequire: function(tree) {
    var url = evaluateStringLiteral(tree.url);
    // Don't handle builtin modules.
    if (url.charAt(0) === '@')
      return tree;
    url = resolveUrl(this.url, url);

    return createIdentifierExpression(generateNameForUrl(url, this.commonPath));
  }
};


var startCodeUnit;

function InlineCodeLoader(reporter, project, elements) {
  InternalLoader.call(this, reporter, project);
  this.elements = elements;
  this.dirname = project.url;
}

InlineCodeLoader.prototype = {
  __proto__: InternalLoader.prototype,

  evalCodeUnit: function(codeUnit) {
    // Don't eval. Instead append the trees to the output.
    var tree = codeUnit.transformedTree;
    this.elements.push.apply(this.elements, tree.programElements);
  },

  transformCodeUnit: function(codeUnit) {
    var transformer = new ModuleRequireTransformer(codeUnit.url, this.dirname);
    var tree = transformer.transformAny(codeUnit.tree);
    if (codeUnit === startCodeUnit)
      return tree;
    return wrapProgram(tree, codeUnit.url, this.dirname);
  },

  loadTextFile: function(filename, callback, errback) {
    var text;
    fs.readFile(path.resolve(this.dirname, filename), 'utf8', function(err, data) {
      if (err) {
        errback(err);
      } else {
        text = data;
        callback(data);
      }
    });

    return {
      get responseText() {
        return text;
      },
      abort: function() {}
    };
  }
};

function allLoaded(url, reporter, elements) {
  var project = new Project(url);
  var programTree = new Program(null, elements);

  var file = new SourceFile(project.url, '/* dummy */');
  project.addFile(file);
  project.setParseTree(file, programTree);

  var analyzer = new ModuleAnalyzer(reporter, project);
  analyzer.analyze();

  var transformer = new ProgramTransformer(reporter, project);
  return transformer.transform(programTree);
}


function inlineAndCompile(filenames, reporter, callback, errback) {
  var basePath = findCommonPath(filenames);

  var loadCount = 0;
  var elements = [];
  var project = new Project(basePath);
  var loader = new InlineCodeLoader(reporter, project, elements);

  function loadNext() {
    var codeUnit = loader.load(filenames[loadCount]);
    startCodeUnit = codeUnit;

    codeUnit.addListener(function() {
      loadCount++;
      if (loadCount < filenames.length) {
        loadNext();
      } else {
        var tree = allLoaded(basePath, reporter, elements);
        callback(tree);
      }
    }, function() {

      console.error(codeUnit.loader.error);
      errback(codeUnit.loader.error);
    });
  }

  loadNext();
}

exports.inlineAndCompile = inlineAndCompile;
