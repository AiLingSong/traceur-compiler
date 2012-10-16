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

  import SymbolType from 'SymbolType.js';

  /**
   * A symbol is a named program element.
   *
   * Symbols are plain old data structures only. They have methods for querying their contents, but
   * symbols do not implement more sophisticated semantics than simple data access.
   *
   * @param {SymbolType} type
   * @param {ParseTree} tree
   * @param {string} name
   * @constructor
   */
  export function Symbol(type, tree, name) {
    this.type = type;
    this.tree = tree;
    this.name = name;
  }

  Symbol.prototype = {

    /**
     * @return {ExportSymbol}
     */
    asExport: function() {
      traceur.assert(this.type == SymbolType.EXPORT);
      return this;
    },

    /**
     * @return {ModuleSymbol}
     */
    asModuleSymbol: function() {
      traceur.assert(this.type == SymbolType.MODULE);
      return this;
    }
  };
