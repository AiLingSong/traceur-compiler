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


/**
 * A token representing a javascript literal. Includes string, regexp, and
 * number literals. Boolean and null literals are represented as regular keyword
 * tokens.
 *
 * The value just includes the raw lexeme. For string literals it includes the
 * begining and ending delimiters.
 *
 * TODO: Regexp literals should have their own token type.
 * TODO: A way to get the processed value, rather than the raw value.
 */

import Token from 'Token.js';
import createObject from '../util/util.js';

  /**
   * @param {TokenType} type
   * @param {string} value
   * @param {SourceRange} location
   * @constructor
   * @extends {Token}
   */
  export function LiteralToken(type, value, location) {
    Token.call(this, type, location);
    this.value = value;
  }

  LiteralToken.prototype = createObject(Token.prototype, {
    toString: function() {
      return this.value;
    }
  });
