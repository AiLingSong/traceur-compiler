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

import FallThroughState from 'FallThroughState.js';
import ParseTreeFactory from '../ParseTreeFactory.js';
import State from 'State.js';
import createObject from '../../util/util.js';

  var createStatementList = ParseTreeFactory.createStatementList;

  /**
   * @param {number} id
   * @param {string} label
   * @constructor
   * @extends {State}
   */
  export function BreakState(id, label) {
    State.call(this, id);
    this.label = label;
  }

  BreakState.prototype = createObject(State.prototype, {
    
    /**
     * @param {number} oldState
     * @param {number} newState
     * @return {BreakState}
     */
    replaceState: function(oldState, newState) {
      return new BreakState(State.replaceStateId(this.id, oldState, newState), this.label);
    },

    /**
     * @param {FinallyState} enclosingFinally
     * @param {number} machineEndState
     * @param {ErrorReporter} reporter
     * @return {Array.<ParseTree>}
     */
    transform: function(enclosingFinally, machineEndState, reporter) {
      throw new Error('These should be removed before the transform step');
    },

    /**
     * @param {Object} labelSet
     * @param {number} breakState
     * @return {State}
     */
    transformBreak: function(labelSet, breakState) {
      if (this.label == null || this.label in labelSet) {
        return new FallThroughState(this.id, breakState, createStatementList());
      }
      return this;
    },

    /**
     * @param {Object} labelSet
     * @param {number} breakState
     * @param {number} continueState
     * @return {State}
     */
    transformBreakOrContinue: function(labelSet, breakState, continueState) {
      return this.transformBreak(labelSet, breakState);
    }
  });
