// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import ParseTreeFactory from 'ParseTreeFactory.js';
import ParseTreeTransformer from 'ParseTreeTransformer.js';
import ParseTreeType from '../syntax/trees/ParseTree.js';
import PredefinedName from '../syntax/PredefinedName.js';
import TokenType from '../syntax/TokenType.js';
import createObject from '../util/util.js';

  var createArgumentList = ParseTreeFactory.createArgumentList;
  var createBinaryOperator = ParseTreeFactory.createBinaryOperator;
  var createCallExpression = ParseTreeFactory.createCallExpression;
  var createMemberExpression = ParseTreeFactory.createMemberExpression;
  var createOperatorToken = ParseTreeFactory.createOperatorToken;

  var IS = PredefinedName.IS;
  var ISNT = PredefinedName.ISNT;
  var RUNTIME = PredefinedName.RUNTIME;
  var TRACEUR = PredefinedName.TRACEUR;

  /**
   * Whether the tree is a good literal. A good literal is one that can be used
   * with === instead of calling traceur.runtime.is.
   * @param {ParseTree} tree
   * @return {boolean}
   */
  function isGoodLiteral(tree) {
    if (tree.type !== ParseTreeType.LITERAL_EXPRESSION)
      return false;
    var token = tree.literalToken;
    if (token.type === TokenType.NUMBER)
      return Number(token.value) !== 0;
    return true;
  }

  /**
   * Desugars is and isnt expressions.
   *
   * @see <a href="http://wiki.ecmascript.org/doku.php?id=harmony:egal">harmony:egal</a>
   *
   * @extends {ParseTreeTransformer}
   * @constructor
   */
  export function IsExpressionTransformer() {}

  IsExpressionTransformer.transformTree = function(tree) {
    return new IsExpressionTransformer().transformAny(tree);
  };

  IsExpressionTransformer.prototype = createObject(
      ParseTreeTransformer.prototype, {

    transformBinaryOperator: function(tree) {
      var operator = tree.operator;
      if (operator.type !== TokenType.IDENTIFIER ||
          operator.value !== IS && operator.value !== ISNT) {
        return ParseTreeTransformer.prototype.transformBinaryOperator.call(this, tree);
      }

      // left is right
      // =>
      // traceur.runtime.is(left, right)
      var left = this.transformAny(tree.left);
      var right = this.transformAny(tree.right);

      // Only 0, -0 and NaN are different from ===. So we can optimize to use
      // === in the case where we have a literal on one of the sides.
      if (isGoodLiteral(left) || isGoodLiteral(right)) {
        var op = operator.value === IS ?
            TokenType.EQUAL_EQUAL_EQUAL : TokenType.NOT_EQUAL_EQUAL;
        return createBinaryOperator(left, createOperatorToken(op), right);
      }

      return createCallExpression(
          createMemberExpression(TRACEUR, RUNTIME, operator.value),
          createArgumentList(left, right));
    }
  });
