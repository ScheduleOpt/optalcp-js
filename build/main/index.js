/*
 * Copyright (C) CoEnzyme SAS - All Rights Reserved
 *
 * This source code is protected under international copyright law.  All rights
 * reserved and protected by the copyright holders.
 * This file is confidential and only available to authorized individuals with the
 * permission of the copyright holders.  If you encounter this file and do not have
 * permission, please contact the copyright holders and delete this file.
 */
/**
 * @packageDocumentation
 * @document ../doc/vsCPO/overview.md
 * @document ../doc/vsCPO/optionals.md
 * @document ../doc/vsCPO/list.md
 */
import { strict as assert } from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter, once } from 'node:events';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
// The following typedoc comment is for constant Version that is added by generate_ts:
/**
 * The version of the module, such as "1.0.0".
 * @group Constants
 */
export const Version = "2025.8.0";
// === Compilation options ===================================================
// Compilation options could be replaced by constants during bundling.
const TYPE_CHECK_LEVEL = 2; // 0: test nothing, 1: test only integers (for ts), 2: test everything (for js)
// === External interfaces ===================================================
/**
 * Maximum value of a decision variable or a decision expression (such as `x+1` where `x` is a variable).
 *
 * @example
 *
 * The following model is infeasible:
 * ```ts
 * let model = new CP.Model();
 * let x = model.intVar({range: [10000000, 2000000]});
 * // Constraint x*x >= 1:
 * model.constraint(x.times(x).ge(1));
 * let result = await CP.solve(model);
 * ```
 * Because for any value of `x`, the expression `x*x` is greater than `IntVarMax` and thus cannot be computed.
 *
 * @group Constants
 */
export const IntVarMax = 1073741823;
/**
 * Minimum value of a decision variable or a decision expression (such as `x+1` where `x` is a variable).
 * The opposite of {@link IntVarMax}.
 * @group Constants
 */
export const IntVarMin = -IntVarMax;
/**
 * Maximum value of start or end of an interval variable. The opposite of {@link IntervalMin}.
 * @group Constants
 */
export const IntervalMax = 715827882;
/**
 * Minimum value of start or end of an interval variable. The opposite of {@link IntervalMax}.
 * @group Constants
 */
export const IntervalMin = -715827882;
/**
 * Maximum length of an interval variable. The maximum length can be achieved by
 * an interval that starts at {@link IntervalMin} and ends at {@link
 * IntervalMax}.
 * @group Constants
 */
export const LengthMax = IntervalMax - IntervalMin;
/** @internal */
export const FloatVarMax = Number.MAX_VALUE;
/** @internal */
export const FloatVarMin = -FloatVarMax;
// === Model nodes ===========================================================
/**
 * The base class for all modeling objects.
 *
 * @example
 *
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let xStart = model.startOf(x);
 * let result = await CP.solve(model);
 * ```
 * Interval variable `x` and expression `xStart` are both instances of {@link ModelNode}.
 * There are specialized descendant classes such as {@link IntervalVar} and {@link IntExpr}.
 *
 * Any modeling object can be assigned a name, see {@link ModelNode#setName} and {@link ModelNode#getName}.
 *
 * @group Modeling
 */
export class ModelNode {
    _props;
    _cp;
    // This is how this node is referred when it is used in an expression.
    // There are two ways:
    //  * { arg: this._props } when it is used only once
    //  * { ref: 12345 } when it is used multiple times
    // The idea is that #arg mutates from the first version to the second version
    // when it is used for the second time.
    // When unused, #arg is undefined.
    #arg;
    constructor(cp, arg1, arg2) {
        this._cp = cp;
        if (typeof arg2 !== "number")
            this._props = { func: arg1, args: arg2 };
        else {
            this._props = arg1;
            this.#arg = { ref: arg2 };
        }
    }
    // setName returns polymorphic `this `type so that it doesn't have to be
    // redefined in descendant classes. TypeScript understands.
    /** Assigns a name to the node.
     *
     * @param name Named to be assigned.
     * @returns The node itself so it can be used in chained expression.
     *
     * @remarks
     *
     * Assigning a name is optional. However, it is helpful for debugging because
     * variable names appear in the development traces. It is also helpful for
     * exporting the model to a file (see {@link problem2json}).
     *
     * @example
     *
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ length: 10 }).setName("x");
     * // The line above is equivalent to:
     * //   let x = model.intervalVar({ length: 10, name:"x" });
     * let endOfX = model.endOf(x).setName("endOfX");
     * let result = await CP.solve(model);
     * ```
     */
    setName(name) {
        this._props.name = name;
        return this;
    }
    /** Returns the name assigned to the node. */
    getName() { return this._props.name; }
    /** @internal */
    _getProps() { return this._props; }
    // Get (and create or mutate) #arg:
    /** @internal */
    _getArg() {
        if (this.#arg === undefined) {
            // The first time someone uses this node in an expression
            this.#arg = { arg: this._props };
        }
        else if (this.#arg.ref === undefined) {
            // The second time the node is used as an argument. Create a ref.
            this.#arg.ref = this._cp._getNewRefId(this._props);
            delete this.#arg.arg;
        }
        return this.#arg;
    }
    // For variables that must always have an ID:
    /** @internal */
    _forceRef() {
        this.#arg = { ref: this._cp._getNewRefId(this._props) };
    }
    /** @internal */
    _getId() {
        return this.#arg.ref;
    }
}
/**
 * @internal
 */
class Blank extends ModelNode {
    #isBlankNode;
    /** @internal */
    constructor(cp, func, args) {
        super(cp, func, args);
        cp._addBlank(this);
    }
}
/**
 * @internal
 */
class ArrayNode extends ModelNode {
    #isNodeArray;
}
/**
 * @internal
 */
class Constraint extends ModelNode {
    // Void field actually does not exist on runtime; however, it makes the types
    // different so that we cannot pass Constraint to a function that expects
    // BoolExprArg.
    #isConstraint;
    /** @internal */
    constructor(cp, func, args) {
        super(cp, func, args);
        cp.constraint(this);
    }
}
// If we don't document FloatExpr, then it is not visible that IntExpr derives
// from ModelNode.
/**
 * A class representing floating-point expression in the model.
 * Currently, there is no way to create floating-point expressions.
 * The class is only a base class for {@link IntExpr}.
 * @group Modeling
 */
export class FloatExpr extends ModelNode {
    #isFloatExpr;
    /** @internal */
    _reusableFloatExpr() {
        let outParams = [this._getArg()];
        const result = new FloatExpr(this._cp, "reusableFloatExpr", outParams);
        return result;
    }
    /** @internal */
    _floatIdentity(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new Constraint(this._cp, "floatIdentity", outParams);
    }
    /** @internal */
    _floatGuard(absentValue = 0) {
        let outParams = [this._getArg(), GetFloat(absentValue)];
        const result = new FloatExpr(this._cp, "floatGuard", outParams);
        return result;
    }
    /** @internal */
    neg() {
        let outParams = [this._getArg()];
        const result = new FloatExpr(this._cp, "floatNeg", outParams);
        return result;
    }
    /** @internal */
    _floatPlus(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new FloatExpr(this._cp, "floatPlus", outParams);
        return result;
    }
    /** @internal */
    _floatMinus(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new FloatExpr(this._cp, "floatMinus", outParams);
        return result;
    }
    /** @internal */
    _floatTimes(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new FloatExpr(this._cp, "floatTimes", outParams);
        return result;
    }
    /** @internal */
    _floatDiv(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new FloatExpr(this._cp, "floatDiv", outParams);
        return result;
    }
    /** @internal */
    _floatEq(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new BoolExpr(this._cp, "floatEq", outParams);
        return result;
    }
    /** @internal */
    _floatNe(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new BoolExpr(this._cp, "floatNe", outParams);
        return result;
    }
    /** @internal */
    _floatLt(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new BoolExpr(this._cp, "floatLt", outParams);
        return result;
    }
    /** @internal */
    _floatLe(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new BoolExpr(this._cp, "floatLe", outParams);
        return result;
    }
    /** @internal */
    _floatGt(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new BoolExpr(this._cp, "floatGt", outParams);
        return result;
    }
    /** @internal */
    _floatGe(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new BoolExpr(this._cp, "floatGe", outParams);
        return result;
    }
    /** @internal */
    _floatInRange(lb, ub) {
        let outParams = [this._getArg(), GetFloat(lb), GetFloat(ub)];
        const result = new BoolExpr(this._cp, "floatInRange", outParams);
        return result;
    }
    /** @internal */
    _floatNotInRange(lb, ub) {
        let outParams = [this._getArg(), GetFloat(lb), GetFloat(ub)];
        const result = new BoolExpr(this._cp, "floatNotInRange", outParams);
        return result;
    }
    /** @internal */
    abs() {
        let outParams = [this._getArg()];
        const result = new FloatExpr(this._cp, "floatAbs", outParams);
        return result;
    }
    /** @internal */
    square() {
        let outParams = [this._getArg()];
        const result = new FloatExpr(this._cp, "floatSquare", outParams);
        return result;
    }
    /** @internal */
    _floatMin2(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new FloatExpr(this._cp, "floatMin2", outParams);
        return result;
    }
    /** @internal */
    _floatMax2(arg) {
        let outParams = [this._getArg(), GetFloatExpr(arg)];
        const result = new FloatExpr(this._cp, "floatMax2", outParams);
        return result;
    }
}
/**
 * A class that represents an integer expression in the model.  The expression
 * may depend on the value of a variable (or variables), so the value of the
 * expression is not known until a solution is found.
 * The value must be in the range {@link IntVarMin} to {@link IntVarMax}.
 *
 * @example
 *
 * The following code creates two interval variables `x` and `y`
 * and an integer expression `maxEnd` that is equal to the maximum of the end
 * times of `x` and `y` (see {@link max2}):
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let y = model.intervalVar({ length: 20, name: "y" });
 * let maxEnd = model.max2(x.end(), y.end());
 * ```
 *
 * ### Optional integer expressions
 *
 * Underlying variables of an integer expression may be optional, i.e., they may
 * or may not be present in a solution (for example, an optional task
 * can be omitted entirely from the solution). In this case, the value of the
 * integer expression is _absent_. The value _absent_ means that the variable
 * has no meaning; it does not exist in the solution.
 *
 * Except {@link guard} expression, any value of an integer
 * expression that depends on an absent variable is also _absent_.
 * As we don't know the value of the expression before the solution is found,
 * we call such expression _optional_.
 *
 * @example
 *
 * In the following model, there is an optional interval variable `x` and
 * a non-optional interval variable `y`.  We add a constraint that the end of `x` plus
 * 10 must be less or equal to the start of `y`:
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x", optional: true });
 * let y = model.intervalVar({ length: 20, name: "y" });
 * let endX = model.endOf(x);
 * let afterX = endX.plus(10);
 * let startY = model.startOf(y);
 * let isBefore = afterX.le(startY);
 * model.constraint(isBefore);
 * let result = await CP.solve(model);
 * ```
 * In this model:
 *
 *  * `endX` is an optional integer expression because it depends on
 *     an optional variable `x`.
 *  * The expression `afterX` is optional for the same reason.
 *  * The expression `startY` is not optional because it depends only on a
 *    non-optional variable `y`.
 *  * Boolean expression `isBefore` is also optional. Its value could be
 *    _true_, _false_ or _absent_.
 *
 * The expression `isBefore` is turned into a constraint using
 * {@link Model.constraint | Model.constraint}. Therefore, it cannot be _false_
 * in the solution. However, it can still be _absent_. Therefore the constraint
 * `isBefore` can be satisfied in two ways:
 *
 * 1. Both `x` and `y` are present, `x` is before `y`, and the delay between them
 *    is at least 10. In this case, `isBefore` is _true_.
 * 2. `x` is absent and `y` is present. In this case, `isBefore` is _absent_.
 *
 * @group Modeling
 */
export class IntExpr extends FloatExpr {
    #isIntExpr;
    /**
     * Minimize the expression. I.e., search for a solution that achieves the minimal
     * value of the expression.
     *
     * @remarks
     * Equivalent of function {@link Model.minimize | Model.minimize}.
     *
     * @example
     *
     * In the following model, we search for a solution that minimizes the maximum
     * end of the two intervals `x` and `y`:
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ length: 10, name: "x" });
     * let y = model.intervalVar({ length: 20, name: "y" });
     * model.max2(x.end(), y.end()).minimize();
     * let result = await CP.solve(model);
     * ```
     */
    minimize() {
        this._cp.minimize(this);
    }
    /**
     * Maximize the expression. I.e., search for a solution that achieves the maximal
     * value of the expression.
     *
     * @remarks
     * Equivalent of function {@link Model.maximize | Model.maximize}.
     *
     * The opposite of {@link minimize}.
     */
    maximize() {
        this._cp.maximize(this);
    }
    /** @internal */
    _reusableIntExpr() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "reusableIntExpr", outParams);
        return result;
    }
    /**
    * Returns an expression which is _true_ if the expression is _present_ and _false_ when it is _absent_.
    *
    * @remarks
    *
    * The resulting expression is never _absent_.
    *
    * Same as {@link Model.presenceOf | Model.presenceOf}. */
    presence() {
        let outParams = [this._getArg()];
        const result = new BoolExpr(this._cp, "intPresenceOf", outParams);
        return result;
    }
    /**
    * Creates an expression that replaces value _absent_ by a constant.
    *
    * @remarks
    *
    * The resulting expression is:
    *
    * * equal to the expression if the expression is _present_
    * * and equal to `absentValue` otherwise (i.e. when the expression is _absent_).
    *
    * The default value of `absentValue` is 0.
    *
    * The resulting expression is never _absent_.
    *
    * Same as {@link Model.guard | Model.guard}. */
    guard(absentValue = 0) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        const result = new IntExpr(this._cp, "intGuard", outParams);
        return result;
    }
    /**
    * Returns negation of the expression.
    *
    * @remarks
    *
    * If the expression has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.neg | Model.neg}. */
    neg() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "intNeg", outParams);
        return result;
    }
    /**
    * Returns addition of the expression and the argument.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.plus | Model.plus}. */
    plus(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intPlus", outParams);
        return result;
    }
    /**
    * Returns subtraction of the expression and `arg`.@remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.minus | Model.minus}. */
    minus(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intMinus", outParams);
        return result;
    }
    /**
    * Returns multiplication of the expression and `arg`.@remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.times | Model.times}. */
    times(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intTimes", outParams);
        return result;
    }
    /**
    * Returns integer division of the expression `arg`. The division rounds towards zero.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.div | Model.div}. */
    div(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intDiv", outParams);
        return result;
    }
    /** @internal */
    _modulo(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "modulo", outParams);
        return result;
    }
    /**
    * Constrains the expression to be identical to the argument, including their presence status.
    *
    * @remarks
    *
    * Identity is different than equality. For example, if `x` is _absent_, then `x.eq(0)` is _absent_, but `x.identity(0)` is _false_.
    *
    * Same as {@link Model.identity | Model.identity}. */
    identity(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new Constraint(this._cp, "intIdentity", outParams);
    }
    /**
    * Creates Boolean expression `this` = `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.eq | Model.eq}. */
    eq(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new BoolExpr(this._cp, "intEq", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `this` &ne; `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.ne | Model.ne}. */
    ne(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new BoolExpr(this._cp, "intNe", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `this` < `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.lt | Model.lt}. */
    lt(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new BoolExpr(this._cp, "intLt", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `this` &le; `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.le | Model.le}. */
    le(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new BoolExpr(this._cp, "intLe", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `this` > `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.gt | Model.gt}. */
    gt(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new BoolExpr(this._cp, "intGt", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `this` &ge; `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.ge | Model.ge}. */
    ge(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new BoolExpr(this._cp, "intGe", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `lb` &le; `this` &le; `ub`.
    *
    * @remarks
    *
    * If the expression has value _absent_, then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link Model.inRange | Model.inRange}. */
    inRange(lb, ub) {
        let outParams = [this._getArg(), GetInt(lb), GetInt(ub)];
        const result = new BoolExpr(this._cp, "intInRange", outParams);
        return result;
    }
    /** @internal */
    _notInRange(lb, ub) {
        let outParams = [this._getArg(), GetInt(lb), GetInt(ub)];
        const result = new BoolExpr(this._cp, "intNotInRange", outParams);
        return result;
    }
    /**
    * Creates an integer expression which is absolute value of the expression.
    *
    * @remarks
    *
    * If the expression has value _absent_, the resulting expression also has value _absent_.
    *
    * Same as {@link Model.abs | Model.abs}.  */
    abs() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "intAbs", outParams);
        return result;
    }
    /**
    * Creates an integer expression which is the minimum of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.min2 | Model.min2}. See {@link Model.min} for the n-ary minimum. */
    min2(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intMin2", outParams);
        return result;
    }
    /**
    * Creates an integer expression which is the maximum of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.max2 | Model.max2}. See {@link Model.max | Model.max} for n-ary maximum. */
    max2(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intMax2", outParams);
        return result;
    }
    /** @internal */
    square() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "intSquare", outParams);
        return result;
    }
}
/**
 * A class that represents a boolean expression in the model.
 * The expression may depend on one or more variables; therefore, its value
 * may be unknown until a solution is found.
 *
 * @example
 *
 * For example, the following code creates two interval variables, `x` and `y`
 * and a boolean expression `isBefore` that is true if `x` ends before `y` starts,
 * that is, if the end of `x` is less than or equal to
 * the start of `y` (see {@link IntExpr.le | IntExpr.le}):
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let y = model.intervalVar({ length: 20, name: "y" });
 * let isBefore = x.end().le(y.start());
 * let result = await CP.solve(model);
 * ```
 *
 * Boolean expressions can be used to create constraints using function {@link
 * Model.constraint | Model.constraint}. In the example above, we may require that `isBefore` is
 * true or _absent_:
 * ```ts
 * model.constraint(isBefore);
 * ```
 *
 * ### Optional boolean expressions
 *
 * _OptalCP_ is using 3-value logic: a boolean expression can be _true_, _false_
 * or _absent_. Typically, the expression is _absent_ only if one or
 * more underlying variables are _absent_.  The value _absent_
 * means that the expression doesn't have a meaning because one or more
 * underlying variables are absent (not part of the solution).
 *
 * ### Difference between constraints and boolean expressions
 *
 * Boolean expressions can take arbitrary value (_true_, _false_, or _absent_)
 * and can be combined into composed expressions (e.g., using {@link and} or
 * {@link or}).
 *
 * Constraints can only be _true_ or _absent_ (in a solution) and cannot
 * be combined into composed expressions.
 *
 * Some functions create constraints directly, e.g. {@link Model.noOverlap}.
 * Then, passing them to function {@link Model.constraint} is unnecessary.
 * It is also not possible to combine constraints into composed expressions
 * such as `or(noOverlap(..), noOverlap(..))`.
 *
 * @example
 *
 * Let's consider a similar example to the one above but with an optional interval
 * variables `a` and `b`:
 *
 * ```ts
 * let model = new CP.Model();
 * let a = model.intervalVar({ length: 10, name: "a", optional: true });
 * let b = model.intervalVar({ length: 20, name: "b", optional: true });
 * let isBefore = a.end().le(b.start());
 * model.constraint(isBefore);
 * let result = await CP.solve(model);
 * ```
 *
 * The function {@link Model.constraint | Model.constraint} requires that the
 * constraint cannot be _false_ in a solution. It could be _absent_ though.
 * Therefore, in our example, there are four kinds of solutions:
 *
 * 1. Both `a` and `b` are present, and `a` ends before `b` starts.
 * 2. Only `a` is present, and `b` is absent.
 * 3. Only `b` is present, and `a` is absent.
 * 4. Both `a` and `b` are absent.
 *
 * In case 1, the expression `isBefore` is _true_. In all the other cases
 * `isBefore` is _absent_ as at least one of the variables `a` and `b` is
 * absent, and then `isBefore` doesn't have a meaning.
 *
 * ### Boolean expressions as integer expressions
 *
 * Class `BoolExpr` derives from {@link IntExpr}. Therefore, boolean expressions can be used
 * as integer expressions. In this case, _true_ is equal to _1_, _false_ is
 * equal to _0_, and _absent_ remains _absent_.
 *
 * @group Modeling
 */
export class BoolExpr extends IntExpr {
    #isBoolExpr;
    /** @internal */
    _reusableBoolExpr() {
        let outParams = [this._getArg()];
        const result = new BoolExpr(this._cp, "reusableBoolExpr", outParams);
        return result;
    }
    /**
    * Returns negation of the expression.
    *
    * @remarks
    *
    * If the expression has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.not | Model.not}. */
    not() {
        let outParams = [this._getArg()];
        const result = new BoolExpr(this._cp, "boolNot", outParams);
        return result;
    }
    /**
    * Returns logical _OR_ of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.or | Model.or}. */
    or(arg) {
        let outParams = [this._getArg(), GetBoolExpr(arg)];
        const result = new BoolExpr(this._cp, "boolOr", outParams);
        return result;
    }
    /**
    * Returns logical _AND_ of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.and | Model.and}. */
    and(arg) {
        let outParams = [this._getArg(), GetBoolExpr(arg)];
        const result = new BoolExpr(this._cp, "boolAnd", outParams);
        return result;
    }
    /**
    * Returns implication between the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.implies | Model.implies}. */
    implies(arg) {
        let outParams = [this._getArg(), GetBoolExpr(arg)];
        const result = new BoolExpr(this._cp, "boolImplies", outParams);
        return result;
    }
    /** @internal */
    _eq(arg) {
        let outParams = [this._getArg(), GetBoolExpr(arg)];
        const result = new BoolExpr(this._cp, "boolEq", outParams);
        return result;
    }
    /** @internal */
    _ne(arg) {
        let outParams = [this._getArg(), GetBoolExpr(arg)];
        const result = new BoolExpr(this._cp, "boolNe", outParams);
        return result;
    }
    /** @internal */
    _nand(arg) {
        let outParams = [this._getArg(), GetBoolExpr(arg)];
        const result = new BoolExpr(this._cp, "boolNand", outParams);
        return result;
    }
}
/** @internal */
export class Objective extends ModelNode {
    #isObjective;
}
/**
 * Integer variable represents an unknown (integer) value that solver has to find.
 *
 * The value of the integer variable can be constrained using mathematical expressions, such as {@link Model.plus}, {@link Model.times}, {@link Model.le}, {@link Model.sum}.
 *
 * OptalCP solver focuses on scheduling problems and concentrates on {@link IntervalVar} variables.
 * Therefore, interval variables should be the primary choice for modeling in OptalCP.
 * However, integer variables can be used for other purposes, such as counting or indexing.
 * In particular, integer variables can be helpful for cumulative expressions with variable heights; see {@link Model.pulse}, {@link Model.stepAtStart}, {@link Model.stepAtEnd}, and {@link Model.stepAt}.
 *
 * The integer variable can be optional.
 * In this case, the solver can make the variable absent, which is usually interpreted as the fact that the solver does not use the variable at all.
 * Functions {@link Model.presenceOf} and {@link IntExpr.presence} can constrain the presence of the variable.
 *
 * Integer variables can be created using the function {@link Model.intVar | Model.intVar}.
 *
 * @example
 *
 * In the following example we create three integer variables `x`, `y` and `z`.
 * Variables `x` and `y` are present, but variable `z` is optional.
 * Each variable has a different range of possible values.
 *
 * ```ts
 * let model = CP.Model;
 * let x = model.intVar({ name: "x", range: [1, 3] });
 * let y = model.intVar({ name: "y", range: [0, 100] });
 * let z = model.intVar({ name: "z", range: [10, 20], optional: true });
 * ```
 *
 * @group Modeling
 */
export class IntVar extends IntExpr {
    constructor(cp, props, id) {
        if (props === undefined) {
            super(cp, "intVar", []);
            this._forceRef();
        }
        else
            super(cp, props, id);
    }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_intVar"; }
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    getMin() {
        if (this.isAbsent())
            return null;
        return this._props.min ?? IntVarMin;
    }
    getMax() {
        if (this.isAbsent())
            return null;
        return this._props.max ?? IntVarMax;
    }
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; return this; }
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; return this; }
    makePresent() { this._props.status = undefined; return this; }
    setMin(min) {
        this._props.min = GetInt(min);
        return this;
    }
    setMax(max) {
        this._props.max = GetInt(max);
        return this;
    }
    setRange(min, max) {
        this._props.min = GetInt(min);
        this._props.max = GetInt(max);
        return this;
    }
}
/** @internal */
export class FloatVar extends FloatExpr {
    constructor(cp, props, id) {
        if (props === undefined) {
            super(cp, "floatVar", []);
            this._forceRef();
        }
        else
            super(cp, props, id);
    }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_floatVar"; }
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    getMin() {
        if (this.isAbsent())
            return null;
        return this._props.min ?? FloatVarMin;
    }
    getMax() {
        if (this.isAbsent())
            return null;
        return this._props.max ?? FloatVarMax;
    }
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; return this; }
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; return this; }
    makePresent() { this._props.status = undefined; return this; }
    setMin(min) {
        this._props.min = GetFloat(min);
        return this;
    }
    setMax(max) {
        this._props.max = GetFloat(max);
        return this;
    }
    setRange(min, max) {
        this._props.min = GetFloat(min);
        this._props.max = GetFloat(max);
        return this;
    }
}
/** @internal */
export class BoolVar extends BoolExpr {
    constructor(cp, props, id) {
        if (props === undefined) {
            super(cp, "boolVar", []);
            this._forceRef();
        }
        else
            super(cp, props, id);
    }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_boolVar"; }
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    getMin() {
        if (this.isAbsent())
            return null;
        return this._props.min ?? false;
    }
    getMax() {
        if (this.isAbsent())
            return null;
        return this._props.max ?? true;
    }
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; return this; }
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; return this; }
    makePresent() { this._props.status = undefined; return this; }
    setMin(min) {
        this._props.min = min;
        return this;
    }
    setMax(max) {
        this._props.max = max;
        return this;
    }
    setRange(min, max) {
        this._props.min = min;
        this._props.max = max;
        return this;
    }
}
/**
 * Interval variable is a task, action, operation, or any other interval with a start
 * and an end. The start and the end of the interval are unknowns that the solver
 * has to find. They could be accessed as integer expressions using
 * {@link IntervalVar.start | IntervalVar.start} and {@link IntervalVar.end | IntervalVar.end}.
 * or using {@link Model.startOf | Model.startOf} and {@link Model.endOf | Model.endOf}.
 * In addition to the start and the end of the interval, the interval variable
 * has a length (equal to _end - start_) that can be accessed using
 * {@link IntervalVar.length | IntervalVar.length} or {@link Model.lengthOf | Model.lengthOf}.
 *
 * The interval variable can be optional. In this case, the solver can decide
 * to make the interval absent, which is usually interpreted as the fact that
 * the interval doesn't exist, the task/action was not executed, or the operation
 * was not performed.  When the interval variable is absent, its start, end,
 * and length are also absent.  A boolean expression that represents the presence
 * of the interval variable can be accessed using
 * {@link IntervalVar.presence | IntervalVar.presence} and {@link Model.presenceOf | Model.presenceOf}.
 *
 *
 * Interval variables can be created using the function
 * {@link Model.intervalVar | Model.intervalVar}.
 * By default, interval variables are _present_ (not optional).
 * To create an optional interval, specify `optional: true` in the
 * arguments of the function.
 *
 * @example: present interval variables
 *
 * In the following example we create three present interval variables `x`, `y` and `z`
 * and we make sure that they don't overlap.  Then, we minimize the maximum of
 * the end times of the three intervals (the makespan):
 * ```ts
 * let model = new CP.Model;
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let y = model.intervalVar({ length: 10, name: "y" });
 * let z = model.intervalVar({ length: 10, name: "z" });
 * model.noOverlap([x, y, z]);
 * model.max([x.end(), y.end(), z.end()]).minimize();
 * let result = await CP.solve(model);
 * ```
 *
 * @example: optional interval variables
 *
 * In the following example, there is a task _X_ that could be performed by two
 * different workers _A_ and _B_.  The interval variable `X` represents the task.
 * It is not optional because the task `X` is mandatory. Interval variable
 * `XA` represents the task `X` when performed by worker _A_ and
 * similarly `XB` represents the task `X` when performed by worker _B_.
 * Both `XA` and `XB` are optional because it is not known beforehand which
 * worker will perform the task.  The constraint {@link alternative} links
 * `X`, `XA` and `XB` together and ensures that only one of `XA` and `XB` is present and that
 * `X` and the present interval are equal.
 *
 * ```ts
 * let model = new CP.Model;
 * let X = model.intervalVar({ length: 10, name: "X" });
 * let XA = model.intervalVar({ name: "XA", optional: true });
 * let XB = model.intervalVar({ name: "XB", optional: true });
 * model.alternative(X, [XA, XB]);
 * let result = await CP.solve(model);
 * ```
 * Variables `XA` and `XB` can be used elsewhere in the model, e.g. to make sure
 * that each worker is assigned to at most one task at a time:
 * ```ts
 * // Tasks of worker A don't overlap:
 * model.noOverlap([... , XA, ...]);
 * // Tasks of worker B don't overlap:
 * model.noOverlap([... , XB, ...]);
 * ```
 *
 * @group Modeling
 */
export class IntervalVar extends ModelNode {
    #isIntervalVar;
    constructor(cp, props, id) {
        if (props === undefined) {
            super(cp, "intervalVar", []);
            this._forceRef();
        }
        else
            super(cp, props, id);
    }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_intervalVar"; }
    /**
     * Returns _true_ if the interval variable was created as _optional_.
     * Optional interval variable can be _absent_ in the solution, i.e., it can be omitted.
     *
     * **Note:** This function checks the presence status of the variable in the model
     * (before the solve), not in the solution.
     *
     * @see {@link isPresent}, {@link isAbsent}
     * @see {@link makeOptional}, {@link makePresent}, {@link makeAbsent}
     */
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    /**
     * Returns _true_ if the interval variable was created _present_ (and
     * therefore cannot be _absent_ in the solution).
     *
     * **Note:** This function returns the presence status of the interval in the
     * model (before the solve), not in the solution.  In particular, for an
     * optional interval variable, this function returns _false_, even though there
     * could be a solution in which the interval is _present_.
     *
     * @see {@link isOptional}, {@link isAbsent}
     * @see {@link makeOptional}, {@link makePresent}, {@link makeAbsent}
     */
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    /**
     * Returns _true_ if the interval variable was created _absent_ (and therefore
     * cannot be _present_ in the solution).
     *
     * **Note:** This function checks the presence status of the interval in the model
     * (before the solve), not in the solution.  In particular, for an optional
     * interval variable, this function returns _false_, even though there could be
     * a solution in which the interval is _absent_.
     *
     * @see {@link isOptional}, {@link isPresent}
     * @see {@link makeOptional}, {@link makePresent}, {@link makeAbsent}
     */
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    /**
     * Returns minimum start value assigned to the interval variable during its
     * construction by {@link Model.intervalVar | Model.intervalVar} or later by
     * function {@link setStart} or function {@link setStartMin}.
     *
     * If the interval is absent, the function returns `null`.
     *
     * **Note:** This function returns the minimum start of the interval in the
     * model (before the solve), not in the solution.
     */
    getStartMin() {
        if (this.isAbsent())
            return null;
        return this._props.startMin ?? IntervalMin;
    }
    /**
     * Returns maximum start value assigned to the interval variable during its
     * construction by {@link Model.intervalVar | Model.intervalVar} or later by
     * function {@link setStart} or function {@link setStartMax}.
     *
     * If the interval is absent, the function returns `null`.
     *
     * **Note:** This function returns the maximum start of the interval in the
     * model (before the solve), not in the solution.
     */
    getStartMax() {
        if (this.isAbsent())
            return null;
        return this._props.startMax ?? IntervalMax;
    }
    /**
     * Returns minimum end assigned to the interval variable during its
     * construction by {@link Model.intervalVar | Model.intervalVar} or later by
     * function {@link setEnd} or function {@link setEndMin}.
     *
     * If the interval is absent, the function returns `null`.
     *
     * **Note:** This function returns the minimum end of the interval in the
     * model (before the solve), not in the solution.
     */
    getEndMin() {
        if (this.isAbsent())
            return null;
        return this._props.endMin ?? IntervalMin;
    }
    /**
     * Returns maximum end assigned to the interval variable during its
     * construction by {@link Model.intervalVar | Model.intervalVar} or later by
     * function {@link setEnd} or function {@link setEndMax}.
     *
     * If the interval is absent, the function returns `null`.
     *
     * **Note:** This function returns the maximum end of the interval in the
     * model (before the solve), not in the solution.
     */
    getEndMax() {
        if (this.isAbsent())
            return null;
        return this._props.endMax ?? IntervalMax;
    }
    /**
     * Returns minimum length assigned to the interval variable during its
     * construction by {@link Model.intervalVar | Model.intervalVar} or later by
     * function {@link setLength} or function {@link setLengthMin}.
     *
     * If the interval is absent, the function returns `null`.
     *
     * **Note:** This function returns the minimum length of the interval in the
     * model (before the solve), not in the solution.
     */
    getLengthMin() {
        if (this.isAbsent())
            return null;
        return this._props.lengthMin ?? 0;
    }
    /**
     * Returns the maximum length assigned to the interval variable during its
     * construction by {@link Model.intervalVar | Model.intervalVar} or later by
     * function {@link setLength} or function {@link setLengthMax}.
     *
     * If the interval is absent, the function returns `null`.
     *
     * **Note:** This function returns the maximum length of the interval in the
     * model (before the solve), not in the solution.
     */
    getLengthMax() {
        if (this.isAbsent())
            return null;
        return this._props.lengthMax ?? LengthMax;
    }
    // Modifiers for fluent API:
    /**
     * Makes the interval variable _optional_.  Optional interval variable can be
     * _absent_ in the solution i.e. can be omitted.
     *
     * It is equivalent to setting `optional: true` in {@link Model.intervalVar | Model.intervalVar}.
     *
     * @returns Returns the interval variable itself to allow chaining.
     *
     * @see {@link makePresent}, {@link makeAbsent}
     * @see {@link isOptional}, {@link isPresent}, {@link isAbsent}
     */
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; return this; }
    /**
     * Makes the interval variable _present_.  The present interval variable cannot be
     * _absent_ in the solution, i.e., cannot be omitted.
     *
     * It is equivalent to setting `optional: false`
     * in {@link Model.intervalVar | Model.intervalVar}.
     *
     * @returns Returns the interval variable itself to allow chaining.
     *
     * @see {@link makeOptional}, {@link makeAbsent}
     * @see {@link isOptional}, {@link isPresent}, {@link isAbsent}
     */
    makePresent() { this._props.status = undefined; return this; }
    /**
     * Makes the interval variable _absent_.  Absent interval variable cannot be
     * _present_ in the solution, i.e., it will be omitted in the solution (and
     * everything that depends on it).
     *
     * @returns Returns the interval variable itself to allow chaining.
     *
     * @see {@link makeOptional}, {@link makePresent}
     * @see {@link isOptional}, {@link isPresent}, {@link isAbsent}
     */
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; return this; }
    setStart(sMin, sMax) {
        this._props.startMin = GetInt(sMin);
        if (sMax === undefined)
            this._props.startMax = sMin;
        else
            this._props.startMax = GetInt(sMax);
        return this;
    }
    /**
     * Sets the minimum start of the interval variable to the given value.
     *
     * It overwrites any previous minimum start limit given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setStart} or {@link setStartMin}.
     * This function does not change the maximum start.
     *
     * Note that the start of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setStart}, {@link setStartMax}
     * @see {@link getStartMin}, {@link getStartMax}
     */
    setStartMin(sMin) {
        this._props.startMin = GetInt(sMin);
        return this;
    }
    /**
     * Sets the maximum start of the interval variable to the given value.
     *
     * It overwrites any previous maximum start limit given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setStart} or {@link setStartMax}.
     * The minimum start is not changed by this function.
     *
     * Note that the start of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setStart}, {@link setStartMin}
     * @see {@link getStartMin}, {@link getStartMax}
     */
    setStartMax(sMax) {
        this._props.startMax = GetInt(sMax);
        return this;
    }
    setEnd(eMin, eMax) {
        this._props.endMin = GetInt(eMin);
        if (eMax === undefined)
            this._props.endMax = eMin;
        else
            this._props.endMax = GetInt(eMax);
        return this;
    }
    /**
     * Sets the minimum end of the interval variable to the given value.
     *
     * It overwrites any previous minimum end limit given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setEnd} or {@link setEndMin}.
     * This function does not change the maximum end.
     *
     * Note that the end of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setEnd}, {@link setEndMax}
     * @see {@link getEndMin}, {@link getEndMax}
     */
    setEndMin(eMin) {
        this._props.endMin = GetInt(eMin);
        return this;
    }
    /**
     * Sets the maximum end of the interval variable to the given value.
     * It overwrites any previous maximum end limit given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setEnd} or {@link setEndMax}.
     * This function does not change the minimum end.
     *
     * Note that the end of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setEnd}, {@link setEndMin}
     * @see {@link getEndMin}, {@link getEndMax}
     */
    setEndMax(eMax) {
        this._props.endMax = GetInt(eMax);
        return this;
    }
    setLength(lMin, lMax) {
        this._props.lengthMin = GetInt(lMin);
        if (lMax === undefined)
            this._props.lengthMax = lMin;
        else
            this._props.lengthMax = GetInt(lMax);
        return this;
    }
    /**
     * Sets the minimum length of the interval variable to the given value.
     * It overwrites any previous minimum length limit given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setLength} or {@link setLengthMin}.
     * This function does not change the maximum length.
     *
     * Note that the length of the interval variable must be in the range 0 to {@link LengthMax}.
     *
     * @see {@link setLength}, {@link setLengthMax}
     * @see {@link getLengthMin}, {@link getLengthMax}
     */
    setLengthMin(lMin) {
        this._props.lengthMin = GetInt(lMin);
        return this;
    }
    /**
     * Sets the maximum length of the interval variable to the given value.
     * It overwrites any previous maximum length limit given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setLength} or {@link setLengthMax}.
     * This function does not change the minimum length.
     *
     * Note that the length of the interval cannot exceed than {@link LengthMax}.
     *
     * @see {@link setLength}, {@link setLengthMin}
     * @see {@link getLengthMin}, {@link getLengthMax}
     */
    setLengthMax(lMax) {
        this._props.lengthMax = GetInt(lMax);
        return this;
    }
    /**
    * Creates a Boolean expression which is true if the interval variable is present.
    *
    * @remarks
    *
    * This function is the same as {@link Model.presenceOf | Model.presenceOf}, see its documentation for more details. */
    presence() {
        let outParams = [this._getArg()];
        const result = new BoolExpr(this._cp, "intervalPresenceOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the start of the interval variable.
    *
    * @remarks
    *
    * If the interval variable is absent, then the resulting expression is also absent.
    *
    * @example
    *
    * In the following example, we constraint interval variable `y` to start after the end of `y` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
    *
    * ```ts
    * let model = new CP.Model;
    * let x = model.intervalVar({ name: "x", ... });
    * let y = model.intervalVar({ name: "y", ... });
    * model.constraint(x.end().plus(10).le(y.start()));
    * model.constraint(x.length().le(y.length()));
    * ```
    *
    * When `x` or `y` is _absent_ then value of both constraints above is _absent_ and therefore they are satisfied.
    *
    * @see {@link Model.startOf} is equivalent function on {@link Model}.
    * @see Function {@link IntervalVar.startOr} is a similar function that replaces value _absent_ by a constant.
    *  */
    start() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "startOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the end of the interval variable.
    *
    * @remarks
    *
    * If the interval variable is absent, then the resulting expression is also absent.
    *
    * @example
    *
    * In the following example, we constraint interval variable `y` to start after the end of `y` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
    *
    * ```ts
    * let model = new CP.Model;
    * let x = model.intervalVar({ name: "x", ... });
    * let y = model.intervalVar({ name: "y", ... });
    * model.constraint(x.end().plus(10).le(y.start()));
    * model.constraint(x.length().le(y.length()));
    * ```
    *
    * When `x` or `y` is _absent_ then value of both constraints above is _absent_ and therefore they are satisfied.
    *
    * @see {@link Model.endOf} is equivalent function on {@link Model}.
    * @see Function {@link IntervalVar.endOr} is a similar function that replaces value _absent_ by a constant.
    *  */
    end() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "endOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the length of the interval variable.
    *
    * @remarks
    *
    * If the interval variable is absent, then the resulting expression is also absent.
    *
    * @example
    *
    * In the following example, we constraint interval variable `y` to start after the end of `y` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
    *
    * ```ts
    * let model = new CP.Model;
    * let x = model.intervalVar({ name: "x", ... });
    * let y = model.intervalVar({ name: "y", ... });
    * model.constraint(x.end().plus(10).le(y.start()));
    * model.constraint(x.length().le(y.length()));
    * ```
    *
    * When `x` or `y` is _absent_ then value of both constraints above is _absent_ and therefore they are satisfied.
    *
    * @see {@link Model.lengthOf} is equivalent function on {@link Model}.
    * @see Function {@link IntervalVar.lengthOr} is a similar function that replaces value _absent_ by a constant.
    *  */
    length() {
        let outParams = [this._getArg()];
        const result = new IntExpr(this._cp, "lengthOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the start of the interval variable. If the interval is absent, then its value is `absentValue`.
    *
    * @remarks
    *
    * This function is equivalent to `interval.start().guard(absentValue)`.
    *
    * @see {@link IntervalVar.start}
    * @see {@link IntExpr.guard}
    *  */
    startOr(absentValue) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        const result = new IntExpr(this._cp, "startOr", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the end of the interval variable. If the interval is absent, then its value is `absentValue`.
    *
    * @remarks
    *
    * This function is equivalent to `interval.end().guard(absentValue)`.
    *
    * @see {@link IntervalVar.end}
    * @see {@link IntExpr.guard}
    *  */
    endOr(absentValue) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        const result = new IntExpr(this._cp, "endOr", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the length of the interval variable. If the interval is absent, then its value is `absentValue`.
    *
    * @remarks
    *
    * This function is equivalent to `interval.length().guard(absentValue)`.
    *
    * @see {@link IntervalVar.length}
    * @see {@link IntExpr.guard}
    *  */
    lengthOr(absentValue) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        const result = new IntExpr(this._cp, "lengthOr", outParams);
        return result;
    }
    /** @internal */
    _overlapLength(interval2) {
        let outParams = [this._getArg(), GetIntervalVar(interval2)];
        const result = new IntExpr(this._cp, "overlapLength", outParams);
        return result;
    }
    /** @internal */
    _alternativeCost(options, weights) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(options), this._cp._getIntArray(weights)];
        const result = new IntExpr(this._cp, "intAlternativeCost", outParams);
        return result;
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).le(successor.end())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be less than or equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.endBeforeEnd | Model.endBeforeEnd }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    endBeforeEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "endBeforeEnd", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).le(successor.start())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be less than or equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.endBeforeStart | Model.endBeforeStart }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    endBeforeStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "endBeforeStart", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).le(successor.end())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be less than or equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.startBeforeEnd | Model.startBeforeEnd }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    startBeforeEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "startBeforeEnd", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).le(successor.start())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be less than or equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.startBeforeStart | Model.startBeforeStart }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    startBeforeStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "startBeforeStart", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).eq(successor.end())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.endAtEnd | Model.endAtEnd }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    endAtEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "endAtEnd", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).eq(successor.start())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.endAtStart | Model.endAtStart }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    endAtStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "endAtStart", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).eq(successor.end())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.startAtEnd | Model.startAtEnd }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    startAtEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "startAtEnd", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Assuming that the current interval is `predecessor`, the constraint is the same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).eq(successor.start())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link Model.startAtStart | Model.startAtStart }      is equivalent function on {@link Model}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    startAtStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this._cp, "startAtStart", outParams);
        this._cp.constraint(result);
    }
    /**
    * Creates alternative constraints for the interval variable and provided `options`.
    *
    * @param options Interval variables to choose from.
    *
    * @remarks
    *
    * This constraint is the same as {@link Model.alternative}. */
    alternative(options) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(options)];
        const result = new Constraint(this._cp, "alternative", outParams);
    }
    /**
    * Constraints the interval variable to span (cover) a set of other interval variables.
    *
    * @param covered The set of interval variables to cover.
    *
    * @remarks
    *
    * This constraint is the same as {@link Model.span}. */
    span(covered) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(covered)];
        const result = new Constraint(this._cp, "span", outParams);
    }
    /**
    * Creates an expression equal to the position of the interval on the sequence.
    *
    * @remarks
    *
    * This function is the same as {@link Model.position | Model.position}. */
    position(sequence) {
        let outParams = [this._getArg(), GetSequenceVar(sequence)];
        const result = new IntExpr(this._cp, "position", outParams);
        return result;
    }
    /**
    * Creates cumulative function (expression) _pulse_ for the interval variable and specified height.
    *
    * @remarks
    *
    * This function is the same as {@link Model.pulse | Model.pulse}.
    *  */
    pulse(height) {
        let outParams = [this._getArg(), GetIntExpr(height)];
        const result = new CumulExpr(this._cp, "pulse", outParams);
        return result;
    }
    /**
    * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
    *
    * @remarks
    *
    * This function is the same as {@link Model.stepAtStart | Model.stepAtStart}.
    *  */
    stepAtStart(height) {
        let outParams = [this._getArg(), GetIntExpr(height)];
        const result = new CumulExpr(this._cp, "stepAtStart", outParams);
        return result;
    }
    /**
    * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
    *
    * @remarks
    *
    * This function is the same as {@link Model.stepAtEnd | Model.stepAtEnd}.
    *  */
    stepAtEnd(height) {
        let outParams = [this._getArg(), GetIntExpr(height)];
        const result = new CumulExpr(this._cp, "stepAtEnd", outParams);
        return result;
    }
    /** @internal */
    _precedenceEnergyBefore(others, heights, capacity) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(others), this._cp._getIntArray(heights), GetInt(capacity)];
        const result = new Constraint(this._cp, "precedenceEnergyBefore", outParams);
        this._cp.constraint(result);
    }
    /** @internal */
    _precedenceEnergyAfter(others, heights, capacity) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(others), this._cp._getIntArray(heights), GetInt(capacity)];
        const result = new Constraint(this._cp, "precedenceEnergyAfter", outParams);
        this._cp.constraint(result);
    }
    /**
    * Forbid the interval variable to overlap with segments of the function where the value is zero.
    *
    * @remarks
    *
    * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero. I.e., if $[s, e)$ is a segment of the step function where the value is zero, then the interval variable either ends before $s$ ($\mathtt{interval.end()} \le s$) or starts after $e$ ($e \le \mathtt{interval.start()}$).
    *
    * @see {@link Model.forbidExtent} for the equivalent function on {@link Model}.
    * @see {@link Model.forbidStart}, {@link Model.forbidEnd} for similar functions that constrain the start/end of an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidExtent(func) {
        let outParams = [this._getArg(), GetIntStepFunction(func)];
        const result = new Constraint(this._cp, "forbidExtent", outParams);
    }
    /**
    * Constrains the start of the interval variable to be outside of the zero-height segments of the step function.
    *
    * @remarks
    *
    * This function is equivalent to:
    *
    * ```
    *   model.constraint(func.stepFunctionEval(interval.start()).ne(0));
    * ```
    *
    * I.e., the function value at the start of the interval variable cannot be zero.
    *
    * @see {@link Model.forbidStart} for the equivalent function on {@link Model}.
    * @see {@link Model.forbidEnd} for similar function that constrains end an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidStart(func) {
        let outParams = [this._getArg(), GetIntStepFunction(func)];
        const result = new Constraint(this._cp, "forbidStart", outParams);
    }
    /**
    * Constrains the end of the interval variable to be outside of the zero-height segments of the step function.
    *
    * @remarks
    *
    * This function is equivalent to:
    *
    * ```
    *   model.constraint(func.stepFunctionEval(interval.end()).ne(0));
    * ```
    *
    * I.e., the function value at the end of the interval variable cannot be zero.
    *
    * @see {@link Model.forbidEnd} for the equivalent function on {@link Model}.
    * @see {@link Model.forbidStart} for similar function that constrains start an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidEnd(func) {
        let outParams = [this._getArg(), GetIntStepFunction(func)];
        const result = new Constraint(this._cp, "forbidEnd", outParams);
    }
    /** @internal */
    _disjunctiveIsBefore(y) {
        let outParams = [this._getArg(), GetIntervalVar(y)];
        const result = new BoolExpr(this._cp, "disjunctiveIsBefore", outParams);
        return result;
    }
    /** @internal */
    _related(y) {
        let outParams = [this._getArg(), GetIntervalVar(y)];
        const result = new Blank(this._cp, "related", outParams);
    }
}
// TODO:2 When we have other constraints on sequenceVar then add links into the following doc.
/**
 * Models a sequence (order) of interval variables.
 *
 * Sequence variable is used with {@link noOverlap} constraint
 * to ensure that some interval variables do not overlap.
 * Such no-overlapping set of interval variables will form a sequence in the solution.
 * The sequence variable captures this order of interval variables
 * and allows additional constraints on the order to be stated.
 *
 * @see {@link Model.position}.
 *
 * @group Modeling
 */
export class SequenceVar extends ModelNode {
    #isSequenceVar;
    /** @internal */
    constructor(cp, func, args) {
        super(cp, func, args);
        this._forceRef();
    }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_sequenceVar"; }
    /**
     * Constrain the interval variables forming the sequence to not overlap.
     *
     * @param transitions 2D square array of minimum transition distances the intervals.
     *                    The first index is the type (index) of the first interval
     *                    in the sequence, the second index is the type (index) of the
     *                    second interval in the sequence.
     *
     * @remarks
     *
     * The `noOverlap` constraint makes sure that the intervals in the sequence
     * do not overlap.  That is, for every pair of interval variables `x` and `y`
     * at least one of the following conditions must hold (in a solution):
     *
     * 1. Interval variable `x` is _absent_. This means that the interval is not
     *    present in the solution (not performed), so it cannot overlap
     *    with any other interval. Only optional interval variables can be _absent_.
     * 2. Interval variable `y` is _absent_.
     * 3. `x` ends before `y` starts, i.e. `x.end()` is less or equal to `y.start()`.
     * 4. `y` ends before `x` starts, i.e. `y.end()` is less or equal to `x.start()`.
     *
     * In addition, if the `transitions` parameter is specified, then the cases 3 and 4
     * are further constrained by the minimum transition distance between the
     * intervals:
     *
     * 3. `x.end() + transitions[x.type][y.type]` is less or equal to `y.start()`.
     * 4. `y.end() + transitions[y.type][x.type]` is less or equal to `x.start()`.
     *
     * where `x.type` and `y.type` are the types of the interval variables `x` and `y`
     * as given in {@link Model.sequenceVar | Model.sequenceVar}. If types were not specified,
     * then they are equal to the indices of the interval variables in the array
     * passed to {@link Model.sequenceVar | Model.sequenceVar}. Transition times
     * cannot be negative.
     *
     * Note that transition times are enforced between every pair of interval variables,
     * not only between direct neighbors.
     *
     * The size of the 2D array `transitions` must be equal to the number of types
     * of the interval variables.
     *
     * This constraint is the same as
     * {@link Model.noOverlap | Model.noOverlap(sequenceVar, ..)}.
     * Constraint
     * {@link Model.noOverlap | Model.noOverlap(intervalVarVar[], ..)}
     * is also the same but specifies the intervals directly instead of using
     * a sequence variable.
     *
     * @example
     *
     * A worker must perform a set of tasks. Each task is characterized by:
     *
     * * `length` of the task (how long it takes to perform it),
     * * `location` of the task (where it must be performed),
     * * a time window `startMin` to `endMax` when the task must be performed.
     *
     * There are three locations, `0`, `1`, and `2`. The minimum travel times between
     * the locations are given by a transition matrix `transitions`. Transition times
     * are not symmetric. For example, it takes 10 minutes to travel from location `0`
     * to location `1` but 15 minutes to travel back from location `1` to location `0`.
     *
     * We will model this problem using `noOverlap` constraint with transition times.
     *
     * ```ts
     * // Travel times between locations:
     * let transitions = [
     *   [ 0, 10, 10],
     *   [15,  0, 10],
     *   [ 5,  5,  0]
     * ];
     * // Tasks to be scheduled:
     * const tasks = [
     *   {location: 0, length: 20, startMin: 0, endMax: 100},
     *   {location: 0, length: 40, startMin: 70, endMax: 200},
     *   {location: 1, length: 10, startMin: 0, endMax: 200},
     *   {location: 1, length: 30, startMin: 100, endMax: 200},
     *   {location: 1, length: 10, startMin: 0, endMax: 150},
     *   {location: 2, length: 15, startMin: 50, endMax: 250},
     *   {location: 2, length: 10, startMin: 20, endMax: 60},
     *   {location: 2, length: 20, startMin: 110, endMax: 250},
     * ];
  
     * let model = new CP.Model;
  
     * // From the array tasks create an array of interval variables:
     * let taskVars = tasks.map((t, i) => model.intervalVar(
     *   { name: "Task" + i, length: t.length, start: [t.startMin,], end: [, t.endMax] }
     * ));
     * // And an array of locations:
     * let types = tasks.map(t => t.location);
  
     * // Create the sequence variable for the tasks, location is the type:
     * let sequence = model.sequenceVar(taskVars, types);
     * // Tasks must not overlap and transitions must be respected:
     * sequence.noOverlap(transitions);
  
     * // Solve the model:
     * let result = await CP.solve(model, { solutionLimit: 1 });
      ```
     */
    noOverlap(transitions) {
        this._noOverlap(transitions);
    }
    /** @internal */
    _noOverlap(transitions) {
        let outParams = [this._getArg()];
        if (transitions !== undefined)
            outParams.push(this._cp._getIntMatrix(transitions));
        const result = new Constraint(this._cp, "noOverlap", outParams);
    }
    /** @internal */
    _sameSequence(sequence2) {
        let outParams = [this._getArg(), GetSequenceVar(sequence2)];
        const result = new Constraint(this._cp, "sameSequence", outParams);
    }
}
/**
 * Cumulative expression.
 *
 * Cumulative expression represents resource usage over time.  The resource
 * could be a machine, a group of workers, a material, or anything of a limited
 * capacity.  The resource usage is not known in advance as it depends on the
 * variables of the problem.  Cumulative expressions allow us to model the resource
 * usage and constrain it.
 *
 * Basic cumulative expressions are:
 *
 * * ***Pulse***: the resource is used over an interval of time.
 *   For example, a pulse can represent a task requiring a certain
 *   number of workers during its execution.  At the beginning of the interval,
 *   the resource usage increases by a given amount, and at the end of the
 *   interval, the resource usage decreases by the same amount.
 *   Pulse can be created by function {@link Model.pulse | Model.pulse}
 *   or {@link IntervalVar.pulse | IntervalVar.pulse }.
 * * ***Step***: a given amount of resource is consumed or produced at a specified
 *   time (e.g., at the start of an interval variable).
 *   Steps may represent an inventory of a material that is
 *   consumed or produced by some tasks (a _reservoir_).
 *   Steps can be created by functions
 *   {@link Model.stepAtStart | Model.stepAtStart},
 *   {@link IntervalVar.stepAtStart | IntervalVar.stepAtStart},
 *   {@link Model.stepAtEnd | Model.stepAtEnd},
 *   {@link IntervalVar.stepAtEnd | IntervalVar.stepAtEnd}. and
 *   {@link Model.stepAt | Model.stepAt}.
 *
 * Cumulative expressions can be combined using
 * {@link Model.cumulPlus}, {@link Model.cumulMinus}, {@link cumulNeg} and
 * {@link Model.cumulSum}.  The resulting cumulative expression represents
 * a sum of the resource usage of the combined expressions.
 *
 * Cumulative expressions can be constrained by {@link Model.cumulGe} and
 * {@link Model.cumulLe} constraints to specify the minimum and maximum
 * allowed resource usage.
 *
 * See {@link Model.cumulLe} and {@link Model.cumulGe} for examples.
 *
 * @group Modeling
 */
export class CumulExpr extends ModelNode {
    #isCumulExpr;
    /**
    * Addition of two cumulative expressions.
    *
    * @remarks
    *
    * This function is the same as {@link Model.plus | Model.plus}.
    *  */
    cumulPlus(rhs) {
        let outParams = [this._getArg(), GetCumulExpr(rhs)];
        const result = new CumulExpr(this._cp, "cumulPlus", outParams);
        return result;
    }
    /**
    * Subtraction of two cumulative expressions.
    *
    * @remarks
    *
    * This function is the same as {@link Model.minus | Model.minus}.
    *  */
    cumulMinus(rhs) {
        let outParams = [this._getArg(), GetCumulExpr(rhs)];
        const result = new CumulExpr(this._cp, "cumulMinus", outParams);
        return result;
    }
    /**
    * Negation of a cumulative expression.
    *
    * @remarks
    *
    * This function is the same as {@link Model.neg | Model.neg}.
    *  */
    cumulNeg() {
        let outParams = [this._getArg()];
        const result = new CumulExpr(this._cp, "cumulNeg", outParams);
        return result;
    }
    /**
    * Constraints the cumulative function to be everywhere less or equal to `maxCapacity`.
    *
    * This function can be used to specify the maximum limit of resource usage at any time. For example, to limit the number of workers working simultaneously, limit the maximum amount of material on stock, etc.
    * See {@link Model.pulse} for an example with `cumulLe`.
    *
    * @see {@link Model.cumulLe | Model.cumulLe} for the equivalent function on {@link Model}.
    * @see {@link Model.cumulGe} for the opposite constraint.
    *  */
    cumulLe(maxCapacity) {
        let outParams = [this._getArg(), GetInt(maxCapacity)];
        const result = new Constraint(this._cp, "cumulLe", outParams);
    }
    /**
    * Constraints the cumulative function to be everywhere greater or equal to `minCapacity`.
    *
    * This function can be used to specify the minimum limit of resource usage at any time. For example to make sure that there is never less than zero material on stock.
    * See {@link Model.stepAtStart} for an example with `cumulGe`.
    *
    * @see {@link Model.cumulGe | Model.cumulGe} for the equivalent function on {@link Model}.
    * @see {@link Model.cumulLe} for the opposite constraint.
    *  */
    cumulGe(minCapacity) {
        let outParams = [this._getArg(), GetInt(minCapacity)];
        const result = new Constraint(this._cp, "cumulGe", outParams);
    }
    /** @internal */
    _cumulMaxProfile(profile) {
        let outParams = [this._getArg(), GetIntStepFunction(profile)];
        const result = new Constraint(this._cp, "cumulMaxProfile", outParams);
    }
    /** @internal */
    _cumulMinProfile(profile) {
        let outParams = [this._getArg(), GetIntStepFunction(profile)];
        const result = new Constraint(this._cp, "cumulMinProfile", outParams);
    }
}
/**
 * Integer step function.
 *
 * Integer step function is a piecewise constant function defined on integer
 * values in range {@link IntVarMin} to {@link IntVarMax}. The function can be
 * created by {@link Model.stepFunction}.
 *
 * Step functions can be used in the following ways:
 *
 *   * Function {@link Model.stepFunctionEval} evaluates the function at the given point (given as {@link IntExpr}).
 *   * Function {@link Model.stepFunctionSum} computes a sum (integral) of the function over an {@link IntervalVar}.
 *   * Constraints {@link Model.forbidStart} and {@link Model.forbidEnd} forbid the start/end of an {@link IntervalVar} to be in a zero-value interval of the function.
 *   * Constraint {@link Model.forbidExtent} forbids the extent of an {@link IntervalVar} to be in a zero-value interval of the function.
 *
 * @group Modeling
 */
export class IntStepFunction extends ModelNode {
    #isStepFunction;
    /** @internal */
    constructor(cp, values) {
        super(cp, "intStepFunction", []);
        // Copy the array so that the user cannot change it later.
        this._props.values = Array.from(values, v => {
            assert(Array.isArray(v) && v.length == 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]), "Step function item is not i the form [integer, integer].");
            return Array.from(v);
        });
    }
    /**
    * Computes sum of values of the step function over the interval `interval`.
    *
    * @remarks
    *
    * The sum is computed over all points in range `interval.start()` .. `interval.end()-1`. The sum includes the function value at the start time but not the value at the end time. If the interval variable has zero length, then the result is 0. If the interval variable is absent, then the result is `absent`.
    *
    * **Requirement**: The step function `func` must be non-negative.
    *
    * @see {@link Model.stepFunctionSum | Model.stepFunctionSum} for the equivalent function on {@link Model}.
    *  */
    stepFunctionSum(interval) {
        let outParams = [this._getArg(), GetIntervalVar(interval)];
        const result = new IntExpr(this._cp, "intStepFunctionSum", outParams);
        return result;
    }
    /** @internal */
    _stepFunctionSumInRange(interval, lb, ub) {
        let outParams = [this._getArg(), GetIntervalVar(interval), GetInt(lb), GetInt(ub)];
        const result = new Constraint(this._cp, "intStepFunctionSumInRange", outParams);
    }
    /**
    * Evaluates the step function at a given point.
    *
    * @remarks
    *
    * The result is the value of the step function at the point `arg`. If the value of `arg` is `absent`, then the result is also `absent`.
    *
    * By constraining the returned value, it is possible to limit `arg` to be only within certain segments of the segmented function. In particular, functions {@link Model.forbidStart} and {@link Model.forbidEnd} work that way.
    *
    * @see {@link Model.stepFunctionEval} for the equivalent function on {@link Model}.
    * @see {@link Model.forbidStart}, {@link Model.forbidEnd} are convenience functions built on top of `stepFunctionEval`.
    *  */
    stepFunctionEval(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        const result = new IntExpr(this._cp, "intStepFunctionEval", outParams);
        return result;
    }
    /** @internal */
    _stepFunctionEvalInRange(arg, lb, ub) {
        let outParams = [this._getArg(), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        const result = new Constraint(this._cp, "intStepFunctionEvalInRange", outParams);
    }
    /** @internal */
    _stepFunctionEvalNotInRange(arg, lb, ub) {
        let outParams = [this._getArg(), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        const result = new Constraint(this._cp, "intStepFunctionEvalNotInRange", outParams);
    }
}
/** @internal */
function GetIntStepFunction(arg) {
    VerifyInstanceOf(arg, IntStepFunction);
    return arg._getArg();
}
/** @internal */
class IntervalExpr extends ModelNode {
    #isIntervalExpr;
}
/** @internal */
class SearchDecision extends ModelNode {
    #isSearchDecision;
}
// === Verification functions ================================================
/** @internal */
function GetInt(arg) {
    if (TYPE_CHECK_LEVEL >= 1)
        assert(Number.isInteger(arg));
    return arg;
}
/** @internal */
function GetIntFromUnknown(arg) {
    if (TYPE_CHECK_LEVEL >= 2)
        assert(typeof (arg) === 'number');
    return GetInt(arg);
}
/** @internal */
function GetFloat(arg) {
    if (TYPE_CHECK_LEVEL >= 2)
        assert(typeof (arg) === 'number');
    return arg;
}
/** @internal */
function GetBool(arg) {
    if (TYPE_CHECK_LEVEL >= 2)
        assert(typeof arg == 'boolean');
    return arg;
}
/** @internal */
function VerifyInstanceOf(arg, Class) {
    if (TYPE_CHECK_LEVEL >= 2)
        assert(arg instanceof Class);
}
/** @internal */
function VerifyArrayInstanceOf(arg, Class) {
    if (TYPE_CHECK_LEVEL >= 2) {
        assert(Array.isArray(arg));
        for (const val of arg)
            assert(val instanceof Class);
    }
}
/** @internal */
function GetFloatExpr(arg) {
    if (typeof arg == 'number' || typeof arg == 'boolean')
        return arg;
    VerifyInstanceOf(arg, FloatExpr);
    return arg._getArg();
}
/** @internal */
function GetIntExpr(arg) {
    if (typeof arg == 'number')
        return GetInt(arg);
    if (typeof arg == 'boolean')
        return arg;
    VerifyInstanceOf(arg, IntExpr);
    return arg._getArg();
}
/** @internal */
function GetSafeArg(arg) {
    if (typeof arg === 'object')
        return arg._getArg();
    return arg;
}
/** @internal */
function GetBoolExpr(arg) {
    if (typeof (arg) == 'boolean')
        return arg;
    VerifyInstanceOf(arg, BoolExpr);
    return arg._getArg();
}
/** @internal */
function GetConstraint(arg) {
    if (typeof (arg) == 'boolean')
        return arg;
    if (TYPE_CHECK_LEVEL >= 2)
        assert(arg instanceof BoolExpr || arg instanceof Constraint);
    return arg._getArg();
}
/** @internal */
function GetIntervalVar(arg) {
    VerifyInstanceOf(arg, IntervalVar);
    return arg._getArg();
}
/** @internal */
function GetCumulExpr(arg) {
    VerifyInstanceOf(arg, CumulExpr);
    return arg._getArg();
}
/** @internal */
function GetSequenceVar(arg) {
    VerifyInstanceOf(arg, SequenceVar);
    return arg._getArg();
}
/** @internal */
function IsBoolExpr(arg) {
    if (typeof (arg) == "boolean")
        return arg;
    return arg instanceof BoolExpr;
}
/** @internal */
function IsIntExpr(arg) {
    if (typeof (arg) == "number")
        return Number.isInteger(arg);
    return arg instanceof IntExpr;
}
/** @internal */
function IsIntArray(arg) {
    if (!Array.isArray(arg))
        return false;
    for (const item of arg)
        if (!Number.isInteger(item))
            return false;
    return true;
}
/** @internal */
function IsIntExprArray(arg) {
    if (!Array.isArray(arg))
        return false;
    for (const item of arg)
        if (!IsIntExpr(item))
            return false;
    return true;
}
/** @internal */
function IsCumulExprArray(arg) {
    if (!Array.isArray(arg))
        return false;
    for (const item of arg)
        if (!(item instanceof CumulExpr))
            return false;
    return true;
}
/**
 * This function creates a deep copy of the input {@link Parameters} object.
 * Afterwards, the copy can be modified without affecting
 * the original {@link Parameters} object.
 *
 * @param params The {@link Parameters} object to copy.
 * @returns A deep copy of the input {@link Parameters} object.
 *
 * @group Parameters
 */
export function copyParameters(params) {
    let copy = { ...params };
    if (params.workers === undefined)
        return copy;
    copy.workers = [];
    for (let i = 0; i < params.workers.length; i++) {
        let w = params.workers[i];
        if (w !== undefined)
            copy.workers[i] = { ...w };
    }
    return copy;
}
/**
 * Combines two {@link Parameters} settings into a new one.
 *
 * @param source Input parameters that can be modified by `modifications`.
 * @param modifications Parameters that will overwrite the parameters from `source`.
 *
 * @remarks
 *
 * The new object contains all parameters from both inputs.  If the same
 * parameter is specified in both input objects, then the value from the second
 * object `modifications` is used.
 *
 * Input objects are not modified.
 *
 * @group Parameters
 */
export function combineParameters(source, modifications) {
    let result = copyParameters(source);
    for (const key in modifications) {
        if (key === "workers")
            continue;
        result[key] = modifications[key];
    }
    if (modifications.workers !== undefined) {
        if (result.workers === undefined)
            result.workers = [];
        for (const i in modifications.workers) {
            let w = modifications.workers[i];
            if (result.workers[i] === undefined)
                result.workers[i] = { ...w };
            else
                for (const key in w)
                    result.workers[i][key] = w[key];
        }
    }
    return result;
}
/** @internal */
export const ParametersHelp = "Help:\n" +
    "  --help, -h                       Print this help\n" +
    "  --version                        Print version information\n" +
    "\nSolver path:\n" +
    "  --solverPath string              Path to the solver\n" +
    "\n" +
    "\
Terminal output:\n\
  --color Never|Auto|Always        Whether to colorize output to the terminal\n\
\n\
Major options:\n\
  --nbWorkers uint32               Number of threads dedicated to search\n\
  --searchType LNS|FDS|FDSLB|SetTimes\n\
                                   Type of search to use\n\
  --randomSeed uint32              Random seed\n\
  --logLevel uint32                Level of the log\n\
  --warningLevel uint32            Level of warnings\n\
  --logPeriod double               How often to print log messages (in seconds)\n\
  --verifySolutions bool           When on, the correctness of solutions is verified\n\
  --verifyExternalSolutions bool   Whether to verify corectness of external solutions\n\
  --allocationBlockSize uint32     The minimal amount of memory in kB for a single allocation\n\
\n\
Limits:\n\
  --timeLimit double               Wall clock limit for execution\n\
  --solutionLimit uint64           Stop the search after the given number of solutions\n\
\n\
Gap Tolerance:\n\
  --absoluteGapTolerance double    Stop the search when the gap is below the tolerance\n\
  --relativeGapTolerance double    Stop the search when the gap is below the tolerance\n\
\n\
Tuning:\n\
  --tagsFromNames Never|Auto|Merge|Force\n\
                                   Whether to derive tags from names\n\
\n\
Propagation levels:\n\
  --noOverlapPropagationLevel uint32\n\
                                   How much to propagate noOverlap constraints\n\
  --cumulPropagationLevel uint32   How much to propagate constraints on cumul functions\n\
  --reservoirPropagationLevel uint32\n\
                                   How much to propagate constraints on cumul functions\n\
  --positionPropagationLevel uint32\n\
                                   How much to propagate position expressions on noOverlap constraints\n\
  --stepFunctionSumPropagationLevel uint32\n\
                                   How much to propagate stepFunctionSum expression\n\
  --usePrecedenceEnergy uint32     Whether to use precedence energy propagation algorithm\n\
  --packPropagationLevel uint32    How much to propagate pack constraints\n\
  --itvMappingPropagationLevel uint32\n\
                                   How much to propagate itvMapping constraint\n\
\n\
Failure-Directed Search:\n\
  --fdsInitialRating double        Initial rating for newly created choices\n\
  --fdsReductionWeight double      Weight of the reduction factor in rating computation\n\
  --fdsRatingAverageLength int32   Length of average rating computed for choices\n\
  --fdsFixedAlpha double           When non-zero, alpha factor for rating updates\n\
  --fdsRatingAverageComparison Off|Global|Depth\n\
                                   Whether to compare the local rating with the average\n\
  --fdsReductionFactor Normal|Zero|Random\n\
                                   Reduction factor R for rating computation\n\
  --fdsReuseClosing bool           Whether always reuse closing choice\n\
  --fdsUniformChoiceStep bool      Whether all initial choices have the same step length\n\
  --fdsLengthStepRatio double      Choice step relative to average length\n\
  --fdsMaxInitialChoicesPerVariable uint32\n\
                                   Maximum number of choices generated initially per a variable\n\
  --fdsAdditionalStepRatio double  Domain split ratio when run out of choices\n\
  --fdsPresenceStatusChoices bool  Whether to generate choices on presence status\n\
  --fdsMaxInitialIntVarChoiceStep uint32\n\
                                   Maximum step when generating initial choices for integer variables.\n\
  --fdsEventTimeInfluence double   Influence of event time to initial choice rating\n\
  --fdsBothFailRewardFactor double\n\
                                   How much to improve rating when both branches fail immediately\n\
  --fdsEpsilon double              How often to chose a choice randomly\n\
  --fdsStrongBranchingSize uint32  Number of choices to try in strong branching\n\
  --fdsStrongBranchingDepth uint32\n\
                                   Up-to what search depth apply strong branching\n\
  --fdsStrongBranchingCriterion Both|Left|Right\n\
                                   How to choose the best choice in strong branching\n\
  --fdsInitialRestartLimit uint64  Fail limit for the first restart\n\
  --fdsRestartStrategy Geometric|Nested|Luby\n\
                                   Restart strategy to use\n\
  --fdsRestartGrowthFactor double  Growth factor for fail limit after each restart\n\
  --fdsMaxCounterAfterRestart uint8\n\
                                   Truncate choice use counts after a restart to this value\n\
  --fdsMaxCounterAfterSolution uint8\n\
                                   Truncate choice use counts after a solution is found\n\
  --fdsResetRestartsAfterSolution bool\n\
                                   Reset restart size after a solution is found (ignored in Luby)\n\
  --fdsUseNogoods bool             Whether to use or not nogood constraints\n\
  --fdsBranchOnObjective bool      Whether to generate choices for objective expression/variable\n\
  --fdsLBStrategy Minimum|Random|Split\n\
                                   A strategy to choose objective cuts during FDSLB search.\n\
  --fdsLBResetRatings bool         Whether to reset ratings when a new LB is proved\n\
\n\
Simple Lower Bound:\n\
  --simpleLBWorker int32           Which worker computes simple lower bound\n\
  --simpleLBMaxIterations uint32   Maximum number of feasibility checks\n\
  --simpleLBShavingRounds uint32   Number of shaving rounds\n\
";
/** @internal */
function handleHelp(args, params, help) {
    if (args.includes("--help") || args.includes("-h")) {
        if (params.usage !== undefined)
            console.log(params.usage + '\n');
        else
            console.log("Usage: node " + process.argv[1] + " [options]\n");
        console.log(help);
        process.exit(0);
    }
    if (args.includes("--version")) {
        if (params.version)
            console.log(params.version);
        let solverPath = calcSolverPath({});
        spawnSync(solverPath, ["--version"], { stdio: "inherit", windowsHide: true });
        console.log("OptalCP JavaScript API " + Version);
        console.log("Solver path: '" + solverPath + "'");
        process.exit(0);
    }
}
/**
 * Parses command-line solver parameters and returns a {@link Parameters} object.
 *
 * @param params The default parameters.  The function will overwrite the
 *              parameters with values specified on the command line.
 * @param args  The command-line arguments to parse.  If not specified then
 *             `process.argv.slice(2)` is used.
 *
 * @remarks
 *
 * For a command-line-oriented application, it is helpful to specify solver parameters
 * using command-line arguments.  This function parses command-line arguments and
 * returns a {@link Parameters} object.
 *
 * Parameter _params_ is input/output.  It may contain a default setting that will
 * be overwritten during parsing.
 *
 * In case of an error (e.g.,
 * unrecognized parameter or an invalid parameter value) the function prints the
 * error an calls `process.exit(1)`.
 *
 * If `--help` or `-h` is given, then the function prints help and calls
 * `process.exit(0)`.  The printed help starts by
 * `params.usage` followed by the list of recognized parameters, which looks like this:
 *
 * ```text
 * Help:
 *   --help, -h                       Print this help
 *   --version                        Print version information
 *
 * Solver path:
 *   --solverPath string              Path to the solver
 *
 * Terminal output:
 *   --color Never|Auto|Always        Whether to colorize output to the terminal
 *
 * Major options:
 *   --nbWorkers uint32               Number of threads dedicated to search
 *   --searchType LNS|FDS|FDSLB|SetTimes
 *                                    Type of search to use
 *   --randomSeed uint32              Random seed
 *   --logLevel uint32                Level of the log
 *   --warningLevel uint32            Level of warnings
 *   --logPeriod double               How often to print log messages (in seconds)
 *   --verifySolutions bool           When on, the correctness of solutions is verified
 *
 * Limits:
 *   --timeLimit double               Wall clock limit for execution
 *   --solutionLimit uint64           Stop the search after the given number of solutions
 *
 * ...
 * ```
 *
 * {@link WorkerParameters} can be specified for individual worker(s) using the following prefixes:
 *
 *  * `--workerN.` or `--workersN.` for worker `N`
 *  * `--workerN-M.` or `--workersN-M.` for workers in the range `N` to `M`
 *
 * For example:
 *
 * * `--worker0.searchType FDS` sets the search type to the first worker only.
 * * `--workers4-8.noOverlapPropagationLevel 4` sets the propagation level of `noOverlap` constraint for workers 4, 5, 6, 7, and 8.
 * For example, `--worker0.searchType FDS` sets the search type to the first worker only.
 *
 * @see This function does not accept any unrecognized arguments. See function
 * {@link parseSomeParameters} to handle unrecognized arguments differently.
 *
 * @see See {@link parseBenchmarkParameters} and {@link parseSomeBenchmarkParameters} for
 *    functions that parse {@link BenchmarkParameters}.
 *
 * @group Parameters
 */
export function parseParameters(params = {}, args = process.argv.slice(2)) {
    handleHelp(args, params, ParametersHelp);
    let parser = new ParameterParser(params);
    parser.parseNoThrow(args);
    return params;
}
/**
 * Parses command-line solver parameters and returns an array of unrecognized arguments.
 *
 * @param params The input/output object.  The function will overwrite the
 *             parameters with values specified on the command line.
 * @param args  The command-line arguments to parse.  If not specified, then
 *           `process.argv.slice(2)` is used.
 * @returns An array of unrecognized arguments.
 *
 * @remarks
 *
 * For a command-line-oriented application, it is helpful to specify solver parameters
 * using command-line arguments.  This function parses command-line arguments and
 * modifies the input _params_ object accordingly. It returns an array of
 * unrecognized arguments that were not parsed.
 *
 * The function is similar to {@link parseParameters}, but it does not stop
 * if an unrecognized parameter is encountered.  Instead, it returns an array of
 * unrecognized arguments.  The caller can then decide what to do with them.
 * The function can still call `process.exit(1)` if another type of error is
 * encountered.
 *
 * The parameter `params` is input/output.  It may contain a default setting that
 * will be overwritten during parsing.
 *
 * If `--help` or `-h` is given, then the function prints help and calls
 * `process.exit(0)`.  The printed help is created by concatenating `params.usage`
 * and the list of recognized parameters which looks like this:
 *
 * ```text
 * Help:
 *   --help, -h                       Print this help
 *   --version                        Print version information
 *
 * Solver path:
 *   --solverPath string              Path to the solver
 *
 * Terminal output:
 *   --color Never|Auto|Always        Whether to colorize output to the terminal
 *
 * Major options:
 *   --nbWorkers uint32               Number of threads dedicated to search
 *   --searchType LNS|FDS|FDSLB|SetTimes
 *                                    Type of search to use
 *   --randomSeed uint32              Random seed
 *   --logLevel uint32                Level of the log
 *   --warningLevel uint32            Level of warnings
 *   --logPeriod double               How often to print log messages (in seconds)
 *   --verifySolutions bool           When on, the correctness of solutions is verified
 *
 * Limits:
 *   --timeLimit double               Wall clock limit for execution
 *   --solutionLimit uint64           Stop the search after the given number of solutions
 *
 * ...
 * ```
 *
 * {@link WorkerParameters} can be specified for individual workers using `--workerN.` prefix.
 * For example, `--worker0.searchType FDS` sets the search type to the first worker only.
 *
 * @see {@link parseParameters} for a similar function that doesn't accept unrecognized arguments.
 *
 * @see functions {@link parseBenchmarkParameters} and {@link parseSomeBenchmarkParameters} for
 *    for parsing {@link BenchmarkParameters}.
 *
 * @group Parameters
 */
export function parseSomeParameters(params, args = process.argv.slice(2)) {
    handleHelp(args, params, ParametersHelp);
    let parser = new ParameterParser(params);
    parser.allowUnknown();
    parser.parseNoThrow(args);
    return parser.getUnrecognized();
}
/**
 @internal
 If any property of the object has value +/-Infinity then it is converted to string.
 */
function infinitiesToString(obj) {
    for (const key in obj)
        if (obj[key] === Infinity)
            obj[key] = 'Infinity';
        else if (obj[key] === -Infinity)
            obj[key] = '-Infinity';
}
/** @internal
 * Inversion of the function infinitiesToString
*/
function parseInfinities(obj) {
    for (const key in obj)
        if (obj[key] === 'Infinity')
            obj[key] = Infinity;
        else if (obj[key] === '-Infinity')
            obj[key] = -Infinity;
}
/** @internal */
function paramsForJSON(params) {
    if (params === undefined)
        return {};
    let result = copyParameters(params);
    // A few parameters are for JavaScript only, not for the engine:
    delete result.solverPath;
    delete result.usage;
    delete result.version;
    // JSON is not able to handle infinities, so convert them to strings:
    infinitiesToString(result);
    if (result.workers !== undefined)
        for (let w of result.workers)
            infinitiesToString(result);
    return result;
}
/** @internal */
function paramsFromJSON(params) {
    if (params === undefined)
        return {};
    parseInfinities(params);
    if (params.workers !== undefined)
        for (let w of params.workers)
            parseInfinities(params);
    return params;
}
// Try to find solver executable in the given package.
// relPath is the relative path within the package from its "bin" directory.
function getSolverPathFromPackage(packageName, relPath) {
    try {
        let binPath = import.meta.resolve(packageName + "/bin/");
        // On Unix the URI looks like this:
        //   file:///home/.../node_modules/@scheduleopt/optalcp-bin/bin/
        // Then we have to strip the "file://" prefix, but not the third slash.
        if (binPath.startsWith("file://"))
            binPath = binPath.slice(7);
        // On windows the URI may look like this:
        //   file:///C:/Users/.../node_modules/@scheduleopt/optalcp-bin/bin/
        // So we have to strip THREE slashes in this case:
        if (process.platform == "win32" && binPath.startsWith("/"))
            binPath = binPath.slice(1);
        let result = binPath.endsWith("/") ? binPath + relPath : binPath + "/" + relPath;
        if (fs.existsSync(result))
            return result;
        console.warn(`Found ${binPath} but the binary ${relPath} is not present there.`);
    }
    catch (e) { }
    return undefined;
}
/**
 * Compute path to the `optalcp` binary.
 *
 * @param params Parameters object that may contain the path to the solver.
 *
 * @remarks
 *
 * This function is used to compute the path to `optalcp` binary, for example,
 * when {@link solve} is called.  Usually, there's no need to call this function
 * directly.  However, it could be used to check the path in case of problems.
 *
 * The function works as follows:
 *   * If the `OPTALCP_SOLVER` environment variable is set, then it is used as the path.
 *   * If `params.solverPath` is set, its value is returned.
 *   * If npm package `@scheduleopt/optalcp-bin` is installed then
 *     it is searched for the `optalcp` executable.
 *   * If npm package `optalcp-bin-preview` is installed then
 *     the it is searched too.
 *   * Finally, if nothing from the above works, the function assumes that
 *     `optalcp` is in the `PATH` and returns returns just `optalcp`.
 *
 * @group Other
*/
export function calcSolverPath(params) {
    if (params.solverPath !== undefined)
        return params.solverPath;
    if (process.env.OPTALCP_SOLVER !== undefined && process.env.OPTALCP_SOLVER !== "")
        return process.env.OPTALCP_SOLVER;
    let binaryName = process.platform == "win32" ? "optalcp.exe" : "optalcp";
    // Path to the executable in the optalcp-bin and optalcp-bin-preview packages:
    let relPath = process.platform + "-" + process.arch + "/" + binaryName;
    // First try to locate the full version:
    let result = getSolverPathFromPackage("@scheduleopt/optalcp-bin", relPath);
    if (result !== undefined)
        return result;
    // Then try to locate the academic version:
    result = getSolverPathFromPackage("@scheduleopt/optalcp-bin-academic", relPath);
    if (result !== undefined)
        return result;
    // Then try to locate the preview version:
    result = getSolverPathFromPackage("@scheduleopt/optalcp-bin-preview", relPath);
    if (result !== undefined)
        return result;
    // Finally assume that optalcp is in the PATH
    return "optalcp";
}
/**
 @internal
 Converts parameters into command-line argument string. Used for benchmarking to
 include the parameters in the result.
 */
function parametersToCLA(params) {
    let result = "";
    let p = params;
    for (const key in p) {
        if (key == "usage")
            continue;
        let value = p[key];
        if (value !== undefined && value !== null && typeof value != "object")
            result += "--" + key + " " + p[key] + " ";
    }
    if (params.workers !== undefined) {
        for (let i = 0; i < params.workers.length; i++) {
            let w = params.workers[i];
            if (w === undefined)
                continue;
            let prefix = "worker" + i + ".";
            for (const key in w)
                result += "--" + prefix + key + " " + w[key] + " ";
        }
    }
    return result;
}
/** @internal */
function ParseNumber(value, parameterName) {
    let result = Number(value);
    if (Number.isNaN(result))
        throw Error("Value " + value + " for parameter " + parameterName + " is not a number.");
    return result;
}
/** @internal */
function ParseBool(value, parameterName) {
    if (value == '1' || value == 't' || value == 'true')
        return true;
    if (value == '0' || value == 'f' || value == 'false')
        return false;
    throw Error("Value " + value + " for parameter " + parameterName + " is not a boolean.");
}
/** @internal */
function ParseString(value) {
    return value;
}
/**
 @internal
 Currently, it contains only the necessary stuff for parsing the command line.
 In the future, it may contain everything needed to set parameter values in a GUI.
*/
let ParameterCatalog = {
    // Color
    setColor: function (params, value) {
        if (typeof value != 'string')
            throw Error('Parameter Color: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'never':
                value = 'Never';
                break;
            case 'auto':
                value = 'Auto';
                break;
            case 'always':
                value = 'Always';
                break;
            default: throw Error('Parameter Color: value "' + value + '" is not valid.');
        }
        params.color = value;
    },
    // NbWorkers
    setNbWorkers: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter NbWorkers: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter NbWorkers: value " + value + " is not in required range 0..4294967295.");
        params.nbWorkers = value;
    },
    // NbHelpers
    /** @internal */
    _setNbHelpers: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter NbHelpers: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter NbHelpers: value " + value + " is not in required range 0..4294967295.");
        params._nbHelpers = value;
    },
    // SearchType
    setSearchType: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter SearchType: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'lns':
                value = 'LNS';
                break;
            case 'fds':
                value = 'FDS';
                break;
            case 'fdslb':
                value = 'FDSLB';
                break;
            case 'settimes':
                value = 'SetTimes';
                break;
            default: throw Error('Parameter SearchType: value "' + value + '" is not valid.');
        }
        workerParams.searchType = value;
    },
    // RandomSeed
    setRandomSeed: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter RandomSeed: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter RandomSeed: value " + value + " is not in required range 0..4294967295.");
        workerParams.randomSeed = value;
    },
    // LogLevel
    setLogLevel: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LogLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 3)
            throw Error("Parameter LogLevel: value " + value + " is not in required range 0..3.");
        params.logLevel = value;
    },
    // WarningLevel
    setWarningLevel: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter WarningLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 3)
            throw Error("Parameter WarningLevel: value " + value + " is not in required range 0..3.");
        params.warningLevel = value;
    },
    // LogPeriod
    setLogPeriod: function (params, value) {
        if (value < 0.010000 || value > Infinity)
            throw Error("Parameter LogPeriod: value " + value + " is not in required range 0.010000..Infinity.");
        params.logPeriod = value;
    },
    // VerifySolutions
    setVerifySolutions: function (params, value) {
        params.verifySolutions = value;
    },
    // VerifyExternalSolutions
    setVerifyExternalSolutions: function (params, value) {
        params.verifyExternalSolutions = value;
    },
    // AllocationBlockSize
    setAllocationBlockSize: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter AllocationBlockSize: value " + value + " is not an integer.");
        if (value < 4 || value > 1073741824)
            throw Error("Parameter AllocationBlockSize: value " + value + " is not in required range 4..1073741824.");
        params.allocationBlockSize = value;
    },
    // TimeLimit
    setTimeLimit: function (params, value) {
        if (value < 0.000000 || value > Infinity)
            throw Error("Parameter TimeLimit: value " + value + " is not in required range 0.000000..Infinity.");
        params.timeLimit = value;
    },
    // SolutionLimit
    setSolutionLimit: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SolutionLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 18446744073709551615)
            throw Error("Parameter SolutionLimit: value " + value + " is not in required range 0..18446744073709551615.");
        params.solutionLimit = value;
    },
    // WorkerFailLimit
    /** @internal */
    _setWorkerFailLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter WorkerFailLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 18446744073709551615)
            throw Error("Parameter WorkerFailLimit: value " + value + " is not in required range 0..18446744073709551615.");
        workerParams._workerFailLimit = value;
    },
    // WorkerBranchLimit
    /** @internal */
    _setWorkerBranchLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter WorkerBranchLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 18446744073709551615)
            throw Error("Parameter WorkerBranchLimit: value " + value + " is not in required range 0..18446744073709551615.");
        workerParams._workerBranchLimit = value;
    },
    // WorkerSolutionLimit
    /** @internal */
    _setWorkerSolutionLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter WorkerSolutionLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 18446744073709551615)
            throw Error("Parameter WorkerSolutionLimit: value " + value + " is not in required range 0..18446744073709551615.");
        workerParams._workerSolutionLimit = value;
    },
    // WorkerLNSStepLimit
    /** @internal */
    _setWorkerLNSStepLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter WorkerLNSStepLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 18446744073709551615)
            throw Error("Parameter WorkerLNSStepLimit: value " + value + " is not in required range 0..18446744073709551615.");
        workerParams._workerLNSStepLimit = value;
    },
    // WorkerRestartLimit
    /** @internal */
    _setWorkerRestartLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter WorkerRestartLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 18446744073709551615)
            throw Error("Parameter WorkerRestartLimit: value " + value + " is not in required range 0..18446744073709551615.");
        workerParams._workerRestartLimit = value;
    },
    // AbsoluteGapTolerance
    setAbsoluteGapTolerance: function (params, value) {
        params.absoluteGapTolerance = value;
    },
    // RelativeGapTolerance
    setRelativeGapTolerance: function (params, value) {
        params.relativeGapTolerance = value;
    },
    // TagsFromNames
    setTagsFromNames: function (params, value) {
        if (typeof value != 'string')
            throw Error('Parameter TagsFromNames: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'never':
                value = 'Never';
                break;
            case 'auto':
                value = 'Auto';
                break;
            case 'merge':
                value = 'Merge';
                break;
            case 'force':
                value = 'Force';
                break;
            default: throw Error('Parameter TagsFromNames: value "' + value + '" is not valid.');
        }
        params.tagsFromNames = value;
    },
    // NoOverlapPropagationLevel
    setNoOverlapPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter NoOverlapPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 4)
            throw Error("Parameter NoOverlapPropagationLevel: value " + value + " is not in required range 1..4.");
        workerParams.noOverlapPropagationLevel = value;
    },
    // CumulPropagationLevel
    setCumulPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter CumulPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 3)
            throw Error("Parameter CumulPropagationLevel: value " + value + " is not in required range 1..3.");
        workerParams.cumulPropagationLevel = value;
    },
    // ReservoirPropagationLevel
    setReservoirPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter ReservoirPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 2)
            throw Error("Parameter ReservoirPropagationLevel: value " + value + " is not in required range 1..2.");
        workerParams.reservoirPropagationLevel = value;
    },
    // PositionPropagationLevel
    setPositionPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter PositionPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 3)
            throw Error("Parameter PositionPropagationLevel: value " + value + " is not in required range 1..3.");
        workerParams.positionPropagationLevel = value;
    },
    // StepFunctionSumPropagationLevel
    setStepFunctionSumPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter StepFunctionSumPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 2)
            throw Error("Parameter StepFunctionSumPropagationLevel: value " + value + " is not in required range 1..2.");
        workerParams.stepFunctionSumPropagationLevel = value;
    },
    // UsePrecedenceEnergy
    setUsePrecedenceEnergy: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter UsePrecedenceEnergy: value " + value + " is not an integer.");
        if (value < 0 || value > 1)
            throw Error("Parameter UsePrecedenceEnergy: value " + value + " is not in required range 0..1.");
        params.usePrecedenceEnergy = value;
    },
    // PackPropagationLevel
    setPackPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter PackPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 2)
            throw Error("Parameter PackPropagationLevel: value " + value + " is not in required range 1..2.");
        workerParams.packPropagationLevel = value;
    },
    // ItvMappingPropagationLevel
    setItvMappingPropagationLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter ItvMappingPropagationLevel: value " + value + " is not an integer.");
        if (value < 1 || value > 2)
            throw Error("Parameter ItvMappingPropagationLevel: value " + value + " is not in required range 1..2.");
        workerParams.itvMappingPropagationLevel = value;
    },
    // SearchTraceLevel
    setSearchTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SearchTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter SearchTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams.searchTraceLevel = value;
    },
    // PropagationTraceLevel
    setPropagationTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter PropagationTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter PropagationTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams.propagationTraceLevel = value;
    },
    // InfoTraceLevel
    setInfoTraceLevel: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter InfoTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter InfoTraceLevel: value " + value + " is not in required range 0..5.");
        params.infoTraceLevel = value;
    },
    // FDSInitialRating
    setFDSInitialRating: function (workerParams, value) {
        if (value < 0.000000 || value > 2.000000)
            throw Error("Parameter FDSInitialRating: value " + value + " is not in required range 0.000000..2.000000.");
        workerParams.fdsInitialRating = value;
    },
    // FDSReductionWeight
    setFDSReductionWeight: function (workerParams, value) {
        if (value < 0.000000 || value > Infinity)
            throw Error("Parameter FDSReductionWeight: value " + value + " is not in required range 0.000000..Infinity.");
        workerParams.fdsReductionWeight = value;
    },
    // FDSRatingAverageLength
    setFDSRatingAverageLength: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSRatingAverageLength: value " + value + " is not an integer.");
        if (value < 0 || value > 254)
            throw Error("Parameter FDSRatingAverageLength: value " + value + " is not in required range 0..254.");
        workerParams.fdsRatingAverageLength = value;
    },
    // FDSFixedAlpha
    setFDSFixedAlpha: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter FDSFixedAlpha: value " + value + " is not in required range 0..1.");
        workerParams.fdsFixedAlpha = value;
    },
    // FDSRatingAverageComparison
    setFDSRatingAverageComparison: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter FDSRatingAverageComparison: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'off':
                value = 'Off';
                break;
            case 'global':
                value = 'Global';
                break;
            case 'depth':
                value = 'Depth';
                break;
            default: throw Error('Parameter FDSRatingAverageComparison: value "' + value + '" is not valid.');
        }
        workerParams.fdsRatingAverageComparison = value;
    },
    // FDSReductionFactor
    setFDSReductionFactor: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter FDSReductionFactor: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'normal':
                value = 'Normal';
                break;
            case 'zero':
                value = 'Zero';
                break;
            case 'random':
                value = 'Random';
                break;
            default: throw Error('Parameter FDSReductionFactor: value "' + value + '" is not valid.');
        }
        workerParams.fdsReductionFactor = value;
    },
    // FDSReuseClosing
    setFDSReuseClosing: function (workerParams, value) {
        workerParams.fdsReuseClosing = value;
    },
    // FDSUniformChoiceStep
    setFDSUniformChoiceStep: function (workerParams, value) {
        workerParams.fdsUniformChoiceStep = value;
    },
    // FDSLengthStepRatio
    setFDSLengthStepRatio: function (workerParams, value) {
        if (value < 0.000000 || value > Infinity)
            throw Error("Parameter FDSLengthStepRatio: value " + value + " is not in required range 0.000000..Infinity.");
        workerParams.fdsLengthStepRatio = value;
    },
    // FDSMaxInitialChoicesPerVariable
    setFDSMaxInitialChoicesPerVariable: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSMaxInitialChoicesPerVariable: value " + value + " is not an integer.");
        if (value < 2 || value > 2147483647)
            throw Error("Parameter FDSMaxInitialChoicesPerVariable: value " + value + " is not in required range 2..2147483647.");
        workerParams.fdsMaxInitialChoicesPerVariable = value;
    },
    // FDSAdditionalStepRatio
    setFDSAdditionalStepRatio: function (workerParams, value) {
        if (value < 2.000000 || value > Infinity)
            throw Error("Parameter FDSAdditionalStepRatio: value " + value + " is not in required range 2.000000..Infinity.");
        workerParams.fdsAdditionalStepRatio = value;
    },
    // FDSPresenceStatusChoices
    setFDSPresenceStatusChoices: function (workerParams, value) {
        workerParams.fdsPresenceStatusChoices = value;
    },
    // FDSMaxInitialIntVarChoiceStep
    setFDSMaxInitialIntVarChoiceStep: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSMaxInitialIntVarChoiceStep: value " + value + " is not an integer.");
        if (value < 1 || value > 1073741823)
            throw Error("Parameter FDSMaxInitialIntVarChoiceStep: value " + value + " is not in required range 1..1073741823.");
        workerParams.fdsMaxInitialIntVarChoiceStep = value;
    },
    // FDSEventTimeInfluence
    setFDSEventTimeInfluence: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter FDSEventTimeInfluence: value " + value + " is not in required range 0..1.");
        workerParams.fdsEventTimeInfluence = value;
    },
    // FDSBothFailRewardFactor
    setFDSBothFailRewardFactor: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter FDSBothFailRewardFactor: value " + value + " is not in required range 0..1.");
        workerParams.fdsBothFailRewardFactor = value;
    },
    // FDSEpsilon
    setFDSEpsilon: function (workerParams, value) {
        if (value < 0.000000 || value > 0.999990)
            throw Error("Parameter FDSEpsilon: value " + value + " is not in required range 0.000000..0.999990.");
        workerParams.fdsEpsilon = value;
    },
    // FDSStrongBranchingSize
    setFDSStrongBranchingSize: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSStrongBranchingSize: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter FDSStrongBranchingSize: value " + value + " is not in required range 0..4294967295.");
        workerParams.fdsStrongBranchingSize = value;
    },
    // FDSStrongBranchingDepth
    setFDSStrongBranchingDepth: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSStrongBranchingDepth: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter FDSStrongBranchingDepth: value " + value + " is not in required range 0..4294967295.");
        workerParams.fdsStrongBranchingDepth = value;
    },
    // FDSStrongBranchingCriterion
    setFDSStrongBranchingCriterion: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter FDSStrongBranchingCriterion: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'both':
                value = 'Both';
                break;
            case 'left':
                value = 'Left';
                break;
            case 'right':
                value = 'Right';
                break;
            default: throw Error('Parameter FDSStrongBranchingCriterion: value "' + value + '" is not valid.');
        }
        workerParams.fdsStrongBranchingCriterion = value;
    },
    // FDSInitialRestartLimit
    setFDSInitialRestartLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSInitialRestartLimit: value " + value + " is not an integer.");
        if (value < 1 || value > 9223372036854775807)
            throw Error("Parameter FDSInitialRestartLimit: value " + value + " is not in required range 1..9223372036854775807.");
        workerParams.fdsInitialRestartLimit = value;
    },
    // FDSRestartStrategy
    setFDSRestartStrategy: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter FDSRestartStrategy: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'geometric':
                value = 'Geometric';
                break;
            case 'nested':
                value = 'Nested';
                break;
            case 'luby':
                value = 'Luby';
                break;
            default: throw Error('Parameter FDSRestartStrategy: value "' + value + '" is not valid.');
        }
        workerParams.fdsRestartStrategy = value;
    },
    // FDSRestartGrowthFactor
    setFDSRestartGrowthFactor: function (workerParams, value) {
        if (value < 1.000000 || value > Infinity)
            throw Error("Parameter FDSRestartGrowthFactor: value " + value + " is not in required range 1.000000..Infinity.");
        workerParams.fdsRestartGrowthFactor = value;
    },
    // FDSMaxCounterAfterRestart
    setFDSMaxCounterAfterRestart: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSMaxCounterAfterRestart: value " + value + " is not an integer.");
        if (value < 0 || value > 255)
            throw Error("Parameter FDSMaxCounterAfterRestart: value " + value + " is not in required range 0..255.");
        workerParams.fdsMaxCounterAfterRestart = value;
    },
    // FDSMaxCounterAfterSolution
    setFDSMaxCounterAfterSolution: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSMaxCounterAfterSolution: value " + value + " is not an integer.");
        if (value < 0 || value > 255)
            throw Error("Parameter FDSMaxCounterAfterSolution: value " + value + " is not in required range 0..255.");
        workerParams.fdsMaxCounterAfterSolution = value;
    },
    // FDSResetRestartsAfterSolution
    setFDSResetRestartsAfterSolution: function (workerParams, value) {
        workerParams.fdsResetRestartsAfterSolution = value;
    },
    // FDSUseNogoods
    setFDSUseNogoods: function (workerParams, value) {
        workerParams.fdsUseNogoods = value;
    },
    // FDSFreezeRatingsAfterProof
    /** @internal */
    _setFDSFreezeRatingsAfterProof: function (workerParams, value) {
        workerParams._fdsFreezeRatingsAfterProof = value;
    },
    // FDSContinueAfterProof
    /** @internal */
    _setFDSContinueAfterProof: function (workerParams, value) {
        workerParams._fdsContinueAfterProof = value;
    },
    // FDSRepeatLimit
    /** @internal */
    _setFDSRepeatLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSRepeatLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter FDSRepeatLimit: value " + value + " is not in required range 0..4294967295.");
        workerParams._fdsRepeatLimit = value;
    },
    // FDSCompletelyRandom
    /** @internal */
    _setFDSCompletelyRandom: function (workerParams, value) {
        workerParams._fdsCompletelyRandom = value;
    },
    // FDSBranchOnObjective
    setFDSBranchOnObjective: function (workerParams, value) {
        workerParams.fdsBranchOnObjective = value;
    },
    // FDSImproveNogoods
    /** @internal */
    _setFDSImproveNogoods: function (workerParams, value) {
        workerParams._fdsImproveNogoods = value;
    },
    // FDSLBStrategy
    setFDSLBStrategy: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter FDSLBStrategy: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'minimum':
                value = 'Minimum';
                break;
            case 'random':
                value = 'Random';
                break;
            case 'split':
                value = 'Split';
                break;
            default: throw Error('Parameter FDSLBStrategy: value "' + value + '" is not valid.');
        }
        workerParams.fdsLBStrategy = value;
    },
    // FDSLBResetRatings
    setFDSLBResetRatings: function (workerParams, value) {
        workerParams.fdsLBResetRatings = value;
    },
    // LNSFirstFailLimit
    /** @internal */
    _setLNSFirstFailLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSFirstFailLimit: value " + value + " is not an integer.");
        if (value < 1 || value > 18446744073709551615)
            throw Error("Parameter LNSFirstFailLimit: value " + value + " is not in required range 1..18446744073709551615.");
        workerParams._lnsFirstFailLimit = value;
    },
    // LNSFailLimitGrowthFactor
    /** @internal */
    _setLNSFailLimitGrowthFactor: function (workerParams, value) {
        if (value < 1.000000 || value > Infinity)
            throw Error("Parameter LNSFailLimitGrowthFactor: value " + value + " is not in required range 1.000000..Infinity.");
        workerParams._lnsFailLimitGrowthFactor = value;
    },
    // LNSFailLimitCoefficient
    /** @internal */
    _setLNSFailLimitCoefficient: function (workerParams, value) {
        if (value < 0.000000 || value > Infinity)
            throw Error("Parameter LNSFailLimitCoefficient: value " + value + " is not in required range 0.000000..Infinity.");
        workerParams._lnsFailLimitCoefficient = value;
    },
    // LNSIterationsAfterFirstSolution
    /** @internal */
    _setLNSIterationsAfterFirstSolution: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSIterationsAfterFirstSolution: value " + value + " is not an integer.");
        if (value < -1 || value > 2147483647)
            throw Error("Parameter LNSIterationsAfterFirstSolution: value " + value + " is not in required range -1..2147483647.");
        workerParams._lnsIterationsAfterFirstSolution = value;
    },
    // LNSAggressiveDominance
    /** @internal */
    _setLNSAggressiveDominance: function (workerParams, value) {
        workerParams._lnsAggressiveDominance = value;
    },
    // LNSViolateHeuristicsProbability
    /** @internal */
    _setLNSViolateHeuristicsProbability: function (workerParams, value) {
        if (value < 0.000000 || value > 1.000000)
            throw Error("Parameter LNSViolateHeuristicsProbability: value " + value + " is not in required range 0.000000..1.000000.");
        workerParams._lnsViolateHeuristicsProbability = value;
    },
    // LNSSameSolutionPeriod
    /** @internal */
    _setLNSSameSolutionPeriod: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSSameSolutionPeriod: value " + value + " is not an integer.");
        if (value < 1 || value > 2147483647)
            throw Error("Parameter LNSSameSolutionPeriod: value " + value + " is not in required range 1..2147483647.");
        workerParams._lnsSameSolutionPeriod = value;
    },
    // LNSTier1Size
    /** @internal */
    _setLNSTier1Size: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSTier1Size: value " + value + " is not an integer.");
        if (value < 1 || value > 1000)
            throw Error("Parameter LNSTier1Size: value " + value + " is not in required range 1..1000.");
        workerParams._lnsTier1Size = value;
    },
    // LNSTier2Size
    /** @internal */
    _setLNSTier2Size: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSTier2Size: value " + value + " is not an integer.");
        if (value < 0 || value > 1000)
            throw Error("Parameter LNSTier2Size: value " + value + " is not in required range 0..1000.");
        workerParams._lnsTier2Size = value;
    },
    // LNSTier3Size
    /** @internal */
    _setLNSTier3Size: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSTier3Size: value " + value + " is not an integer.");
        if (value < 0 || value > 1000)
            throw Error("Parameter LNSTier3Size: value " + value + " is not in required range 0..1000.");
        workerParams._lnsTier3Size = value;
    },
    // LNSTier2Effort
    /** @internal */
    _setLNSTier2Effort: function (workerParams, value) {
        if (value < 0.000000 || value > 1.000000)
            throw Error("Parameter LNSTier2Effort: value " + value + " is not in required range 0.000000..1.000000.");
        workerParams._lnsTier2Effort = value;
    },
    // LNSTier3Effort
    /** @internal */
    _setLNSTier3Effort: function (workerParams, value) {
        if (value < 0.000000 || value > 1.000000)
            throw Error("Parameter LNSTier3Effort: value " + value + " is not in required range 0.000000..1.000000.");
        workerParams._lnsTier3Effort = value;
    },
    // LNSStepFailLimitFactor
    /** @internal */
    _setLNSStepFailLimitFactor: function (workerParams, value) {
        if (value < 0.000000 || value > Infinity)
            throw Error("Parameter LNSStepFailLimitFactor: value " + value + " is not in required range 0.000000..Infinity.");
        workerParams._lnsStepFailLimitFactor = value;
    },
    // LNSApplyCutProbability
    /** @internal */
    _setLNSApplyCutProbability: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSApplyCutProbability: value " + value + " is not in required range 0..1.");
        workerParams._lnsApplyCutProbability = value;
    },
    // LNSSmallStructureLimit
    /** @internal */
    _setLNSSmallStructureLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSSmallStructureLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 10)
            throw Error("Parameter LNSSmallStructureLimit: value " + value + " is not in required range 0..10.");
        workerParams._lnsSmallStructureLimit = value;
    },
    // LNSResourceOptimization
    /** @internal */
    _setLNSResourceOptimization: function (workerParams, value) {
        workerParams._lnsResourceOptimization = value;
    },
    // LNSHeuristicsEpsilon
    /** @internal */
    _setLNSHeuristicsEpsilon: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSHeuristicsEpsilon: value " + value + " is not in required range 0..1.");
        workerParams._lnsHeuristicsEpsilon = value;
    },
    // LNSHeuristicsAlpha
    /** @internal */
    _setLNSHeuristicsAlpha: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSHeuristicsAlpha: value " + value + " is not in required range 0..1.");
        workerParams._lnsHeuristicsAlpha = value;
    },
    // LNSHeuristicsTemperature
    /** @internal */
    _setLNSHeuristicsTemperature: function (workerParams, value) {
        if (value < -1 || value > 1)
            throw Error("Parameter LNSHeuristicsTemperature: value " + value + " is not in required range -1..1.");
        workerParams._lnsHeuristicsTemperature = value;
    },
    // LNSHeuristicsUniform
    /** @internal */
    _setLNSHeuristicsUniform: function (workerParams, value) {
        workerParams._lnsHeuristicsUniform = value;
    },
    // LNSHeuristicsInitialQ
    /** @internal */
    _setLNSHeuristicsInitialQ: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSHeuristicsInitialQ: value " + value + " is not in required range 0..1.");
        workerParams._lnsHeuristicsInitialQ = value;
    },
    // LNSPortionEpsilon
    /** @internal */
    _setLNSPortionEpsilon: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSPortionEpsilon: value " + value + " is not in required range 0..1.");
        workerParams._lnsPortionEpsilon = value;
    },
    // LNSPortionAlpha
    /** @internal */
    _setLNSPortionAlpha: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSPortionAlpha: value " + value + " is not in required range 0..1.");
        workerParams._lnsPortionAlpha = value;
    },
    // LNSPortionTemperature
    /** @internal */
    _setLNSPortionTemperature: function (workerParams, value) {
        if (value < -1 || value > 1)
            throw Error("Parameter LNSPortionTemperature: value " + value + " is not in required range -1..1.");
        workerParams._lnsPortionTemperature = value;
    },
    // LNSPortionUniform
    /** @internal */
    _setLNSPortionUniform: function (workerParams, value) {
        workerParams._lnsPortionUniform = value;
    },
    // LNSPortionInitialQ
    /** @internal */
    _setLNSPortionInitialQ: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSPortionInitialQ: value " + value + " is not in required range 0..1.");
        workerParams._lnsPortionInitialQ = value;
    },
    // LNSPortionHandicapLimit
    /** @internal */
    _setLNSPortionHandicapLimit: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSPortionHandicapLimit: value " + value + " is not in required range 0..1.");
        workerParams._lnsPortionHandicapLimit = value;
    },
    // LNSPortionHandicapValue
    /** @internal */
    _setLNSPortionHandicapValue: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSPortionHandicapValue: value " + value + " is not in required range 0..1.");
        workerParams._lnsPortionHandicapValue = value;
    },
    // LNSPortionHandicapInitialQ
    /** @internal */
    _setLNSPortionHandicapInitialQ: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSPortionHandicapInitialQ: value " + value + " is not in required range 0..1.");
        workerParams._lnsPortionHandicapInitialQ = value;
    },
    // LNSNeighborhoodStrategy
    /** @internal */
    _setLNSNeighborhoodStrategy: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSNeighborhoodStrategy: value " + value + " is not an integer.");
        if (value < 0 || value > 2)
            throw Error("Parameter LNSNeighborhoodStrategy: value " + value + " is not in required range 0..2.");
        workerParams._lnsNeighborhoodStrategy = value;
    },
    // LNSNeighborhoodEpsilon
    /** @internal */
    _setLNSNeighborhoodEpsilon: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSNeighborhoodEpsilon: value " + value + " is not in required range 0..1.");
        workerParams._lnsNeighborhoodEpsilon = value;
    },
    // LNSNeighborhoodAlpha
    /** @internal */
    _setLNSNeighborhoodAlpha: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSNeighborhoodAlpha: value " + value + " is not in required range 0..1.");
        workerParams._lnsNeighborhoodAlpha = value;
    },
    // LNSNeighborhoodTemperature
    /** @internal */
    _setLNSNeighborhoodTemperature: function (workerParams, value) {
        if (value < -1 || value > 1)
            throw Error("Parameter LNSNeighborhoodTemperature: value " + value + " is not in required range -1..1.");
        workerParams._lnsNeighborhoodTemperature = value;
    },
    // LNSNeighborhoodUniform
    /** @internal */
    _setLNSNeighborhoodUniform: function (workerParams, value) {
        workerParams._lnsNeighborhoodUniform = value;
    },
    // LNSNeighborhoodInitialQ
    /** @internal */
    _setLNSNeighborhoodInitialQ: function (workerParams, value) {
        if (value < 0 || value > 1)
            throw Error("Parameter LNSNeighborhoodInitialQ: value " + value + " is not in required range 0..1.");
        workerParams._lnsNeighborhoodInitialQ = value;
    },
    // LNSUseWarmStartOnly
    /** @internal */
    _setLNSUseWarmStartOnly: function (workerParams, value) {
        workerParams._lnsUseWarmStartOnly = value;
    },
    // LNSDivingLimit
    /** @internal */
    _setLNSDivingLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSDivingLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter LNSDivingLimit: value " + value + " is not in required range 0..4294967295.");
        workerParams._lnsDivingLimit = value;
    },
    // LNSDivingFailLimitRatio
    /** @internal */
    _setLNSDivingFailLimitRatio: function (workerParams, value) {
        if (value < 0.000000 || value > Infinity)
            throw Error("Parameter LNSDivingFailLimitRatio: value " + value + " is not in required range 0.000000..Infinity.");
        workerParams._lnsDivingFailLimitRatio = value;
    },
    // LNSLearningRun
    /** @internal */
    _setLNSLearningRun: function (workerParams, value) {
        workerParams._lnsLearningRun = value;
    },
    // LNSStayOnObjective
    /** @internal */
    _setLNSStayOnObjective: function (workerParams, value) {
        workerParams._lnsStayOnObjective = value;
    },
    // SimpleLBWorker
    setSimpleLBWorker: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SimpleLBWorker: value " + value + " is not an integer.");
        if (value < -1 || value > 2147483647)
            throw Error("Parameter SimpleLBWorker: value " + value + " is not in required range -1..2147483647.");
        workerParams.simpleLBWorker = value;
    },
    // SimpleLBMaxIterations
    setSimpleLBMaxIterations: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SimpleLBMaxIterations: value " + value + " is not an integer.");
        if (value < 0 || value > 2147483647)
            throw Error("Parameter SimpleLBMaxIterations: value " + value + " is not in required range 0..2147483647.");
        workerParams.simpleLBMaxIterations = value;
    },
    // SimpleLBShavingRounds
    setSimpleLBShavingRounds: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SimpleLBShavingRounds: value " + value + " is not an integer.");
        if (value < 0 || value > 2147483647)
            throw Error("Parameter SimpleLBShavingRounds: value " + value + " is not in required range 0..2147483647.");
        workerParams.simpleLBShavingRounds = value;
    },
    // DebugTraceLevel
    /** @internal */
    _setDebugTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter DebugTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter DebugTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._debugTraceLevel = value;
    },
    // MemoryTraceLevel
    /** @internal */
    _setMemoryTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter MemoryTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter MemoryTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._memoryTraceLevel = value;
    },
    // PropagationDetailTraceLevel
    /** @internal */
    _setPropagationDetailTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter PropagationDetailTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter PropagationDetailTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._propagationDetailTraceLevel = value;
    },
    // SetTimesTraceLevel
    /** @internal */
    _setSetTimesTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SetTimesTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter SetTimesTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._setTimesTraceLevel = value;
    },
    // CommunicationTraceLevel
    /** @internal */
    _setCommunicationTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter CommunicationTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter CommunicationTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._communicationTraceLevel = value;
    },
    // PresolveTraceLevel
    /** @internal */
    _setPresolveTraceLevel: function (params, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter PresolveTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter PresolveTraceLevel: value " + value + " is not in required range 0..5.");
        params._presolveTraceLevel = value;
    },
    // ConversionTraceLevel
    /** @internal */
    _setConversionTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter ConversionTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter ConversionTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._conversionTraceLevel = value;
    },
    // ExpressionBuilderTraceLevel
    /** @internal */
    _setExpressionBuilderTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter ExpressionBuilderTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter ExpressionBuilderTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._expressionBuilderTraceLevel = value;
    },
    // MemorizationTraceLevel
    /** @internal */
    _setMemorizationTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter MemorizationTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter MemorizationTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._memorizationTraceLevel = value;
    },
    // SearchDetailTraceLevel
    /** @internal */
    _setSearchDetailTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter SearchDetailTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter SearchDetailTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._searchDetailTraceLevel = value;
    },
    // FDSTraceLevel
    /** @internal */
    _setFDSTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter FDSTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._fdsTraceLevel = value;
    },
    // ShavingTraceLevel
    /** @internal */
    _setShavingTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter ShavingTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter ShavingTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._shavingTraceLevel = value;
    },
    // FDSRatingsTraceLevel
    /** @internal */
    _setFDSRatingsTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter FDSRatingsTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter FDSRatingsTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._fdsRatingsTraceLevel = value;
    },
    // LNSTraceLevel
    /** @internal */
    _setLNSTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter LNSTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter LNSTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._lnsTraceLevel = value;
    },
    // HeuristicReplayTraceLevel
    /** @internal */
    _setHeuristicReplayTraceLevel: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter HeuristicReplayTraceLevel: value " + value + " is not an integer.");
        if (value < 0 || value > 5)
            throw Error("Parameter HeuristicReplayTraceLevel: value " + value + " is not in required range 0..5.");
        workerParams._heuristicReplayTraceLevel = value;
    },
    // AllowSetTimesProofs
    /** @internal */
    _setAllowSetTimesProofs: function (workerParams, value) {
        workerParams._allowSetTimesProofs = value;
    },
    // SetTimesAggressiveDominance
    /** @internal */
    _setSetTimesAggressiveDominance: function (workerParams, value) {
        workerParams._setTimesAggressiveDominance = value;
    },
    // SetTimesExtendsCoef
    /** @internal */
    _setSetTimesExtendsCoef: function (workerParams, value) {
        workerParams._setTimesExtendsCoef = value;
    },
    // SetTimesHeightStrategy
    /** @internal */
    _setSetTimesHeightStrategy: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter SetTimesHeightStrategy: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'frommax':
                value = 'FromMax';
                break;
            case 'frommin':
                value = 'FromMin';
                break;
            case 'random':
                value = 'Random';
                break;
            default: throw Error('Parameter SetTimesHeightStrategy: value "' + value + '" is not valid.');
        }
        workerParams._setTimesHeightStrategy = value;
    },
    // SetTimesItvMappingStrategy
    /** @internal */
    _setSetTimesItvMappingStrategy: function (workerParams, value) {
        if (typeof value != 'string')
            throw Error('Parameter SetTimesItvMappingStrategy: value "' + value + '" is not valid.');
        switch (value.toLowerCase()) {
            case 'frommax':
                value = 'FromMax';
                break;
            case 'frommin':
                value = 'FromMin';
                break;
            case 'random':
                value = 'Random';
                break;
            default: throw Error('Parameter SetTimesItvMappingStrategy: value "' + value + '" is not valid.');
        }
        workerParams._setTimesItvMappingStrategy = value;
    },
    // DiscreteLowCapacityLimit
    /** @internal */
    _setDiscreteLowCapacityLimit: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter DiscreteLowCapacityLimit: value " + value + " is not an integer.");
        if (value < 0 || value > 16)
            throw Error("Parameter DiscreteLowCapacityLimit: value " + value + " is not in required range 0..16.");
        workerParams._discreteLowCapacityLimit = value;
    },
    // LNSTrainingObjectiveLimit
    /** @internal */
    _setLNSTrainingObjectiveLimit: function (workerParams, value) {
        workerParams._lnsTrainingObjectiveLimit = value;
    },
    // POSAbsentRelated
    /** @internal */
    _setPOSAbsentRelated: function (workerParams, value) {
        workerParams._pOSAbsentRelated = value;
    },
    // DefaultCallbackBlockSize
    /** @internal */
    _setDefaultCallbackBlockSize: function (workerParams, value) {
        if (!Number.isInteger(value))
            throw Error("Parameter DefaultCallbackBlockSize: value " + value + " is not an integer.");
        if (value < 0 || value > 4294967295)
            throw Error("Parameter DefaultCallbackBlockSize: value " + value + " is not in required range 0..4294967295.");
        workerParams._defaultCallbackBlockSize = value;
    },
    // UseReservoirPegging
    /** @internal */
    _setUseReservoirPegging: function (workerParams, value) {
        workerParams._useReservoirPegging = value;
    },
};
/** @internal */
let parserConfig = {
    solverpath: {
        name: 'SolverPath',
        parse: ParseString,
        setGlobally: function (params, value) { params.solverPath = value; }
    },
    color: {
        name: 'Color',
        parse: ParseString,
        setGlobally: ParameterCatalog.setColor,
    },
    nbworkers: {
        name: 'NbWorkers',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setNbWorkers,
    },
    nbhelpers: {
        name: 'NbHelpers',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setNbHelpers,
    },
    searchtype: {
        name: 'SearchType',
        parse: ParseString,
        setGlobally: ParameterCatalog.setSearchType,
        setOnWorker: ParameterCatalog.setSearchType,
    },
    randomseed: {
        name: 'RandomSeed',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setRandomSeed,
        setOnWorker: ParameterCatalog.setRandomSeed,
    },
    loglevel: {
        name: 'LogLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setLogLevel,
    },
    warninglevel: {
        name: 'WarningLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setWarningLevel,
    },
    logperiod: {
        name: 'LogPeriod',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setLogPeriod,
    },
    verifysolutions: {
        name: 'VerifySolutions',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setVerifySolutions,
    },
    verifyexternalsolutions: {
        name: 'VerifyExternalSolutions',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setVerifyExternalSolutions,
    },
    allocationblocksize: {
        name: 'AllocationBlockSize',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setAllocationBlockSize,
    },
    timelimit: {
        name: 'TimeLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setTimeLimit,
    },
    solutionlimit: {
        name: 'SolutionLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setSolutionLimit,
    },
    workerfaillimit: {
        name: 'WorkerFailLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setWorkerFailLimit,
        setOnWorker: ParameterCatalog._setWorkerFailLimit,
    },
    workerbranchlimit: {
        name: 'WorkerBranchLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setWorkerBranchLimit,
        setOnWorker: ParameterCatalog._setWorkerBranchLimit,
    },
    workersolutionlimit: {
        name: 'WorkerSolutionLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setWorkerSolutionLimit,
        setOnWorker: ParameterCatalog._setWorkerSolutionLimit,
    },
    workerlnssteplimit: {
        name: 'WorkerLNSStepLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setWorkerLNSStepLimit,
        setOnWorker: ParameterCatalog._setWorkerLNSStepLimit,
    },
    workerrestartlimit: {
        name: 'WorkerRestartLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setWorkerRestartLimit,
        setOnWorker: ParameterCatalog._setWorkerRestartLimit,
    },
    absolutegaptolerance: {
        name: 'AbsoluteGapTolerance',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setAbsoluteGapTolerance,
    },
    relativegaptolerance: {
        name: 'RelativeGapTolerance',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setRelativeGapTolerance,
    },
    tagsfromnames: {
        name: 'TagsFromNames',
        parse: ParseString,
        setGlobally: ParameterCatalog.setTagsFromNames,
    },
    nooverlappropagationlevel: {
        name: 'NoOverlapPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setNoOverlapPropagationLevel,
        setOnWorker: ParameterCatalog.setNoOverlapPropagationLevel,
    },
    cumulpropagationlevel: {
        name: 'CumulPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setCumulPropagationLevel,
        setOnWorker: ParameterCatalog.setCumulPropagationLevel,
    },
    reservoirpropagationlevel: {
        name: 'ReservoirPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setReservoirPropagationLevel,
        setOnWorker: ParameterCatalog.setReservoirPropagationLevel,
    },
    positionpropagationlevel: {
        name: 'PositionPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setPositionPropagationLevel,
        setOnWorker: ParameterCatalog.setPositionPropagationLevel,
    },
    stepfunctionsumpropagationlevel: {
        name: 'StepFunctionSumPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setStepFunctionSumPropagationLevel,
        setOnWorker: ParameterCatalog.setStepFunctionSumPropagationLevel,
    },
    useprecedenceenergy: {
        name: 'UsePrecedenceEnergy',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setUsePrecedenceEnergy,
    },
    packpropagationlevel: {
        name: 'PackPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setPackPropagationLevel,
        setOnWorker: ParameterCatalog.setPackPropagationLevel,
    },
    itvmappingpropagationlevel: {
        name: 'ItvMappingPropagationLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setItvMappingPropagationLevel,
        setOnWorker: ParameterCatalog.setItvMappingPropagationLevel,
    },
    searchtracelevel: {
        name: 'SearchTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setSearchTraceLevel,
        setOnWorker: ParameterCatalog.setSearchTraceLevel,
    },
    propagationtracelevel: {
        name: 'PropagationTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setPropagationTraceLevel,
        setOnWorker: ParameterCatalog.setPropagationTraceLevel,
    },
    infotracelevel: {
        name: 'InfoTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setInfoTraceLevel,
    },
    fdsinitialrating: {
        name: 'FDSInitialRating',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSInitialRating,
        setOnWorker: ParameterCatalog.setFDSInitialRating,
    },
    fdsreductionweight: {
        name: 'FDSReductionWeight',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSReductionWeight,
        setOnWorker: ParameterCatalog.setFDSReductionWeight,
    },
    fdsratingaveragelength: {
        name: 'FDSRatingAverageLength',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSRatingAverageLength,
        setOnWorker: ParameterCatalog.setFDSRatingAverageLength,
    },
    fdsfixedalpha: {
        name: 'FDSFixedAlpha',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSFixedAlpha,
        setOnWorker: ParameterCatalog.setFDSFixedAlpha,
    },
    fdsratingaveragecomparison: {
        name: 'FDSRatingAverageComparison',
        parse: ParseString,
        setGlobally: ParameterCatalog.setFDSRatingAverageComparison,
        setOnWorker: ParameterCatalog.setFDSRatingAverageComparison,
    },
    fdsreductionfactor: {
        name: 'FDSReductionFactor',
        parse: ParseString,
        setGlobally: ParameterCatalog.setFDSReductionFactor,
        setOnWorker: ParameterCatalog.setFDSReductionFactor,
    },
    fdsreuseclosing: {
        name: 'FDSReuseClosing',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSReuseClosing,
        setOnWorker: ParameterCatalog.setFDSReuseClosing,
    },
    fdsuniformchoicestep: {
        name: 'FDSUniformChoiceStep',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSUniformChoiceStep,
        setOnWorker: ParameterCatalog.setFDSUniformChoiceStep,
    },
    fdslengthstepratio: {
        name: 'FDSLengthStepRatio',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSLengthStepRatio,
        setOnWorker: ParameterCatalog.setFDSLengthStepRatio,
    },
    fdsmaxinitialchoicespervariable: {
        name: 'FDSMaxInitialChoicesPerVariable',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSMaxInitialChoicesPerVariable,
        setOnWorker: ParameterCatalog.setFDSMaxInitialChoicesPerVariable,
    },
    fdsadditionalstepratio: {
        name: 'FDSAdditionalStepRatio',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSAdditionalStepRatio,
        setOnWorker: ParameterCatalog.setFDSAdditionalStepRatio,
    },
    fdspresencestatuschoices: {
        name: 'FDSPresenceStatusChoices',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSPresenceStatusChoices,
        setOnWorker: ParameterCatalog.setFDSPresenceStatusChoices,
    },
    fdsmaxinitialintvarchoicestep: {
        name: 'FDSMaxInitialIntVarChoiceStep',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSMaxInitialIntVarChoiceStep,
        setOnWorker: ParameterCatalog.setFDSMaxInitialIntVarChoiceStep,
    },
    fdseventtimeinfluence: {
        name: 'FDSEventTimeInfluence',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSEventTimeInfluence,
        setOnWorker: ParameterCatalog.setFDSEventTimeInfluence,
    },
    fdsbothfailrewardfactor: {
        name: 'FDSBothFailRewardFactor',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSBothFailRewardFactor,
        setOnWorker: ParameterCatalog.setFDSBothFailRewardFactor,
    },
    fdsepsilon: {
        name: 'FDSEpsilon',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSEpsilon,
        setOnWorker: ParameterCatalog.setFDSEpsilon,
    },
    fdsstrongbranchingsize: {
        name: 'FDSStrongBranchingSize',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSStrongBranchingSize,
        setOnWorker: ParameterCatalog.setFDSStrongBranchingSize,
    },
    fdsstrongbranchingdepth: {
        name: 'FDSStrongBranchingDepth',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSStrongBranchingDepth,
        setOnWorker: ParameterCatalog.setFDSStrongBranchingDepth,
    },
    fdsstrongbranchingcriterion: {
        name: 'FDSStrongBranchingCriterion',
        parse: ParseString,
        setGlobally: ParameterCatalog.setFDSStrongBranchingCriterion,
        setOnWorker: ParameterCatalog.setFDSStrongBranchingCriterion,
    },
    fdsinitialrestartlimit: {
        name: 'FDSInitialRestartLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSInitialRestartLimit,
        setOnWorker: ParameterCatalog.setFDSInitialRestartLimit,
    },
    fdsrestartstrategy: {
        name: 'FDSRestartStrategy',
        parse: ParseString,
        setGlobally: ParameterCatalog.setFDSRestartStrategy,
        setOnWorker: ParameterCatalog.setFDSRestartStrategy,
    },
    fdsrestartgrowthfactor: {
        name: 'FDSRestartGrowthFactor',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSRestartGrowthFactor,
        setOnWorker: ParameterCatalog.setFDSRestartGrowthFactor,
    },
    fdsmaxcounterafterrestart: {
        name: 'FDSMaxCounterAfterRestart',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSMaxCounterAfterRestart,
        setOnWorker: ParameterCatalog.setFDSMaxCounterAfterRestart,
    },
    fdsmaxcounteraftersolution: {
        name: 'FDSMaxCounterAfterSolution',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setFDSMaxCounterAfterSolution,
        setOnWorker: ParameterCatalog.setFDSMaxCounterAfterSolution,
    },
    fdsresetrestartsaftersolution: {
        name: 'FDSResetRestartsAfterSolution',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSResetRestartsAfterSolution,
        setOnWorker: ParameterCatalog.setFDSResetRestartsAfterSolution,
    },
    fdsusenogoods: {
        name: 'FDSUseNogoods',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSUseNogoods,
        setOnWorker: ParameterCatalog.setFDSUseNogoods,
    },
    fdsfreezeratingsafterproof: {
        name: 'FDSFreezeRatingsAfterProof',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setFDSFreezeRatingsAfterProof,
        setOnWorker: ParameterCatalog._setFDSFreezeRatingsAfterProof,
    },
    fdscontinueafterproof: {
        name: 'FDSContinueAfterProof',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setFDSContinueAfterProof,
        setOnWorker: ParameterCatalog._setFDSContinueAfterProof,
    },
    fdsrepeatlimit: {
        name: 'FDSRepeatLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setFDSRepeatLimit,
        setOnWorker: ParameterCatalog._setFDSRepeatLimit,
    },
    fdscompletelyrandom: {
        name: 'FDSCompletelyRandom',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setFDSCompletelyRandom,
        setOnWorker: ParameterCatalog._setFDSCompletelyRandom,
    },
    fdsbranchonobjective: {
        name: 'FDSBranchOnObjective',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSBranchOnObjective,
        setOnWorker: ParameterCatalog.setFDSBranchOnObjective,
    },
    fdsimprovenogoods: {
        name: 'FDSImproveNogoods',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setFDSImproveNogoods,
        setOnWorker: ParameterCatalog._setFDSImproveNogoods,
    },
    fdslbstrategy: {
        name: 'FDSLBStrategy',
        parse: ParseString,
        setGlobally: ParameterCatalog.setFDSLBStrategy,
        setOnWorker: ParameterCatalog.setFDSLBStrategy,
    },
    fdslbresetratings: {
        name: 'FDSLBResetRatings',
        parse: ParseBool,
        setGlobally: ParameterCatalog.setFDSLBResetRatings,
        setOnWorker: ParameterCatalog.setFDSLBResetRatings,
    },
    lnsfirstfaillimit: {
        name: 'LNSFirstFailLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSFirstFailLimit,
        setOnWorker: ParameterCatalog._setLNSFirstFailLimit,
    },
    lnsfaillimitgrowthfactor: {
        name: 'LNSFailLimitGrowthFactor',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSFailLimitGrowthFactor,
        setOnWorker: ParameterCatalog._setLNSFailLimitGrowthFactor,
    },
    lnsfaillimitcoefficient: {
        name: 'LNSFailLimitCoefficient',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSFailLimitCoefficient,
        setOnWorker: ParameterCatalog._setLNSFailLimitCoefficient,
    },
    lnsiterationsafterfirstsolution: {
        name: 'LNSIterationsAfterFirstSolution',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSIterationsAfterFirstSolution,
        setOnWorker: ParameterCatalog._setLNSIterationsAfterFirstSolution,
    },
    lnsaggressivedominance: {
        name: 'LNSAggressiveDominance',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSAggressiveDominance,
        setOnWorker: ParameterCatalog._setLNSAggressiveDominance,
    },
    lnsviolateheuristicsprobability: {
        name: 'LNSViolateHeuristicsProbability',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSViolateHeuristicsProbability,
        setOnWorker: ParameterCatalog._setLNSViolateHeuristicsProbability,
    },
    lnssamesolutionperiod: {
        name: 'LNSSameSolutionPeriod',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSSameSolutionPeriod,
        setOnWorker: ParameterCatalog._setLNSSameSolutionPeriod,
    },
    lnstier1size: {
        name: 'LNSTier1Size',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTier1Size,
        setOnWorker: ParameterCatalog._setLNSTier1Size,
    },
    lnstier2size: {
        name: 'LNSTier2Size',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTier2Size,
        setOnWorker: ParameterCatalog._setLNSTier2Size,
    },
    lnstier3size: {
        name: 'LNSTier3Size',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTier3Size,
        setOnWorker: ParameterCatalog._setLNSTier3Size,
    },
    lnstier2effort: {
        name: 'LNSTier2Effort',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTier2Effort,
        setOnWorker: ParameterCatalog._setLNSTier2Effort,
    },
    lnstier3effort: {
        name: 'LNSTier3Effort',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTier3Effort,
        setOnWorker: ParameterCatalog._setLNSTier3Effort,
    },
    lnsstepfaillimitfactor: {
        name: 'LNSStepFailLimitFactor',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSStepFailLimitFactor,
        setOnWorker: ParameterCatalog._setLNSStepFailLimitFactor,
    },
    lnsapplycutprobability: {
        name: 'LNSApplyCutProbability',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSApplyCutProbability,
        setOnWorker: ParameterCatalog._setLNSApplyCutProbability,
    },
    lnssmallstructurelimit: {
        name: 'LNSSmallStructureLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSSmallStructureLimit,
        setOnWorker: ParameterCatalog._setLNSSmallStructureLimit,
    },
    lnsresourceoptimization: {
        name: 'LNSResourceOptimization',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSResourceOptimization,
        setOnWorker: ParameterCatalog._setLNSResourceOptimization,
    },
    lnsheuristicsepsilon: {
        name: 'LNSHeuristicsEpsilon',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSHeuristicsEpsilon,
        setOnWorker: ParameterCatalog._setLNSHeuristicsEpsilon,
    },
    lnsheuristicsalpha: {
        name: 'LNSHeuristicsAlpha',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSHeuristicsAlpha,
        setOnWorker: ParameterCatalog._setLNSHeuristicsAlpha,
    },
    lnsheuristicstemperature: {
        name: 'LNSHeuristicsTemperature',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSHeuristicsTemperature,
        setOnWorker: ParameterCatalog._setLNSHeuristicsTemperature,
    },
    lnsheuristicsuniform: {
        name: 'LNSHeuristicsUniform',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSHeuristicsUniform,
        setOnWorker: ParameterCatalog._setLNSHeuristicsUniform,
    },
    lnsheuristicsinitialq: {
        name: 'LNSHeuristicsInitialQ',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSHeuristicsInitialQ,
        setOnWorker: ParameterCatalog._setLNSHeuristicsInitialQ,
    },
    lnsportionepsilon: {
        name: 'LNSPortionEpsilon',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionEpsilon,
        setOnWorker: ParameterCatalog._setLNSPortionEpsilon,
    },
    lnsportionalpha: {
        name: 'LNSPortionAlpha',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionAlpha,
        setOnWorker: ParameterCatalog._setLNSPortionAlpha,
    },
    lnsportiontemperature: {
        name: 'LNSPortionTemperature',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionTemperature,
        setOnWorker: ParameterCatalog._setLNSPortionTemperature,
    },
    lnsportionuniform: {
        name: 'LNSPortionUniform',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSPortionUniform,
        setOnWorker: ParameterCatalog._setLNSPortionUniform,
    },
    lnsportioninitialq: {
        name: 'LNSPortionInitialQ',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionInitialQ,
        setOnWorker: ParameterCatalog._setLNSPortionInitialQ,
    },
    lnsportionhandicaplimit: {
        name: 'LNSPortionHandicapLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionHandicapLimit,
        setOnWorker: ParameterCatalog._setLNSPortionHandicapLimit,
    },
    lnsportionhandicapvalue: {
        name: 'LNSPortionHandicapValue',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionHandicapValue,
        setOnWorker: ParameterCatalog._setLNSPortionHandicapValue,
    },
    lnsportionhandicapinitialq: {
        name: 'LNSPortionHandicapInitialQ',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSPortionHandicapInitialQ,
        setOnWorker: ParameterCatalog._setLNSPortionHandicapInitialQ,
    },
    lnsneighborhoodstrategy: {
        name: 'LNSNeighborhoodStrategy',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSNeighborhoodStrategy,
        setOnWorker: ParameterCatalog._setLNSNeighborhoodStrategy,
    },
    lnsneighborhoodepsilon: {
        name: 'LNSNeighborhoodEpsilon',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSNeighborhoodEpsilon,
        setOnWorker: ParameterCatalog._setLNSNeighborhoodEpsilon,
    },
    lnsneighborhoodalpha: {
        name: 'LNSNeighborhoodAlpha',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSNeighborhoodAlpha,
        setOnWorker: ParameterCatalog._setLNSNeighborhoodAlpha,
    },
    lnsneighborhoodtemperature: {
        name: 'LNSNeighborhoodTemperature',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSNeighborhoodTemperature,
        setOnWorker: ParameterCatalog._setLNSNeighborhoodTemperature,
    },
    lnsneighborhooduniform: {
        name: 'LNSNeighborhoodUniform',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSNeighborhoodUniform,
        setOnWorker: ParameterCatalog._setLNSNeighborhoodUniform,
    },
    lnsneighborhoodinitialq: {
        name: 'LNSNeighborhoodInitialQ',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSNeighborhoodInitialQ,
        setOnWorker: ParameterCatalog._setLNSNeighborhoodInitialQ,
    },
    lnsusewarmstartonly: {
        name: 'LNSUseWarmStartOnly',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSUseWarmStartOnly,
        setOnWorker: ParameterCatalog._setLNSUseWarmStartOnly,
    },
    lnsdivinglimit: {
        name: 'LNSDivingLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSDivingLimit,
        setOnWorker: ParameterCatalog._setLNSDivingLimit,
    },
    lnsdivingfaillimitratio: {
        name: 'LNSDivingFailLimitRatio',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSDivingFailLimitRatio,
        setOnWorker: ParameterCatalog._setLNSDivingFailLimitRatio,
    },
    lnslearningrun: {
        name: 'LNSLearningRun',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSLearningRun,
        setOnWorker: ParameterCatalog._setLNSLearningRun,
    },
    lnsstayonobjective: {
        name: 'LNSStayOnObjective',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setLNSStayOnObjective,
        setOnWorker: ParameterCatalog._setLNSStayOnObjective,
    },
    simplelbworker: {
        name: 'SimpleLBWorker',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setSimpleLBWorker,
        setOnWorker: ParameterCatalog.setSimpleLBWorker,
    },
    simplelbmaxiterations: {
        name: 'SimpleLBMaxIterations',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setSimpleLBMaxIterations,
        setOnWorker: ParameterCatalog.setSimpleLBMaxIterations,
    },
    simplelbshavingrounds: {
        name: 'SimpleLBShavingRounds',
        parse: ParseNumber,
        setGlobally: ParameterCatalog.setSimpleLBShavingRounds,
        setOnWorker: ParameterCatalog.setSimpleLBShavingRounds,
    },
    debugtracelevel: {
        name: 'DebugTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setDebugTraceLevel,
        setOnWorker: ParameterCatalog._setDebugTraceLevel,
    },
    memorytracelevel: {
        name: 'MemoryTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setMemoryTraceLevel,
        setOnWorker: ParameterCatalog._setMemoryTraceLevel,
    },
    propagationdetailtracelevel: {
        name: 'PropagationDetailTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setPropagationDetailTraceLevel,
        setOnWorker: ParameterCatalog._setPropagationDetailTraceLevel,
    },
    settimestracelevel: {
        name: 'SetTimesTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setSetTimesTraceLevel,
        setOnWorker: ParameterCatalog._setSetTimesTraceLevel,
    },
    communicationtracelevel: {
        name: 'CommunicationTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setCommunicationTraceLevel,
        setOnWorker: ParameterCatalog._setCommunicationTraceLevel,
    },
    presolvetracelevel: {
        name: 'PresolveTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setPresolveTraceLevel,
    },
    conversiontracelevel: {
        name: 'ConversionTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setConversionTraceLevel,
        setOnWorker: ParameterCatalog._setConversionTraceLevel,
    },
    expressionbuildertracelevel: {
        name: 'ExpressionBuilderTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setExpressionBuilderTraceLevel,
        setOnWorker: ParameterCatalog._setExpressionBuilderTraceLevel,
    },
    memorizationtracelevel: {
        name: 'MemorizationTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setMemorizationTraceLevel,
        setOnWorker: ParameterCatalog._setMemorizationTraceLevel,
    },
    searchdetailtracelevel: {
        name: 'SearchDetailTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setSearchDetailTraceLevel,
        setOnWorker: ParameterCatalog._setSearchDetailTraceLevel,
    },
    fdstracelevel: {
        name: 'FDSTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setFDSTraceLevel,
        setOnWorker: ParameterCatalog._setFDSTraceLevel,
    },
    shavingtracelevel: {
        name: 'ShavingTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setShavingTraceLevel,
        setOnWorker: ParameterCatalog._setShavingTraceLevel,
    },
    fdsratingstracelevel: {
        name: 'FDSRatingsTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setFDSRatingsTraceLevel,
        setOnWorker: ParameterCatalog._setFDSRatingsTraceLevel,
    },
    lnstracelevel: {
        name: 'LNSTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTraceLevel,
        setOnWorker: ParameterCatalog._setLNSTraceLevel,
    },
    heuristicreplaytracelevel: {
        name: 'HeuristicReplayTraceLevel',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setHeuristicReplayTraceLevel,
        setOnWorker: ParameterCatalog._setHeuristicReplayTraceLevel,
    },
    allowsettimesproofs: {
        name: 'AllowSetTimesProofs',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setAllowSetTimesProofs,
        setOnWorker: ParameterCatalog._setAllowSetTimesProofs,
    },
    settimesaggressivedominance: {
        name: 'SetTimesAggressiveDominance',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setSetTimesAggressiveDominance,
        setOnWorker: ParameterCatalog._setSetTimesAggressiveDominance,
    },
    settimesextendscoef: {
        name: 'SetTimesExtendsCoef',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setSetTimesExtendsCoef,
        setOnWorker: ParameterCatalog._setSetTimesExtendsCoef,
    },
    settimesheightstrategy: {
        name: 'SetTimesHeightStrategy',
        parse: ParseString,
        setGlobally: ParameterCatalog._setSetTimesHeightStrategy,
        setOnWorker: ParameterCatalog._setSetTimesHeightStrategy,
    },
    settimesitvmappingstrategy: {
        name: 'SetTimesItvMappingStrategy',
        parse: ParseString,
        setGlobally: ParameterCatalog._setSetTimesItvMappingStrategy,
        setOnWorker: ParameterCatalog._setSetTimesItvMappingStrategy,
    },
    discretelowcapacitylimit: {
        name: 'DiscreteLowCapacityLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setDiscreteLowCapacityLimit,
        setOnWorker: ParameterCatalog._setDiscreteLowCapacityLimit,
    },
    lnstrainingobjectivelimit: {
        name: 'LNSTrainingObjectiveLimit',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setLNSTrainingObjectiveLimit,
        setOnWorker: ParameterCatalog._setLNSTrainingObjectiveLimit,
    },
    posabsentrelated: {
        name: 'POSAbsentRelated',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setPOSAbsentRelated,
        setOnWorker: ParameterCatalog._setPOSAbsentRelated,
    },
    defaultcallbackblocksize: {
        name: 'DefaultCallbackBlockSize',
        parse: ParseNumber,
        setGlobally: ParameterCatalog._setDefaultCallbackBlockSize,
        setOnWorker: ParameterCatalog._setDefaultCallbackBlockSize,
    },
    usereservoirpegging: {
        name: 'UseReservoirPegging',
        parse: ParseBool,
        setGlobally: ParameterCatalog._setUseReservoirPegging,
        setOnWorker: ParameterCatalog._setUseReservoirPegging,
    },
};
/** @internal */
class ParameterParser {
    #params;
    #unknown = [];
    #unknownAllowed = false;
    constructor(params) {
        this.#params = params;
    }
    allowUnknown() { this.#unknownAllowed = true; }
    getUnrecognized() { return this.#unknown; }
    #addUnrecognized(opt) {
        if (this.#unknownAllowed)
            this.#unknown.push(opt);
        else
            throw Error("Unrecognized command line option: " + opt);
    }
    #getOrCreateWorker(workerId) {
        if (this.#params.workers === undefined)
            this.#params.workers = [];
        if (this.#params.workers[workerId] === undefined) {
            let result = {};
            this.#params.workers[workerId] = result;
            return result;
        }
        return this.#params.workers[workerId];
    }
    // Returns false if the option doesn't exist (and should be added into unrecognized)
    #applyParameter(name, value) {
        // Remove '--' at the beginning of the parameter name:
        let opt = name.slice(2).toLowerCase();
        let workerRange = undefined;
        // Syntax is, for example:
        //   --worker3.searchType
        //   --worker0-3.searchType
        //   --workers0-3.searchType
        if (opt.match(/^worker[s]?[0-9]/)) {
            opt = opt.slice(6);
            if (opt[0] == 's')
                opt = opt.slice(1);
            let dotPosition = opt.indexOf(".");
            if (dotPosition == -1)
                throw Error("Invalid worker specification: " + name);
            let workerDesc = opt.slice(0, dotPosition);
            opt = opt.slice(dotPosition + 1);
            let dashPosition = workerDesc.indexOf("-");
            if (dashPosition == -1) {
                // Single worker specification
                let singleWorker = Number(workerDesc);
                if (Number.isNaN(singleWorker))
                    throw Error("Invalid worker specification: " + name);
                workerRange = [singleWorker, singleWorker];
            }
            else {
                // Worker range specification
                let minWorker = Number(workerDesc.slice(0, dashPosition));
                let maxWorker = Number(workerDesc.slice(dashPosition + 1));
                if (minWorker == -1 || maxWorker == -1)
                    throw Error("Invalid worker specification: " + name);
                if (minWorker > maxWorker)
                    throw Error("Empty range worker specification: " + name);
                workerRange = [minWorker, maxWorker];
            }
        }
        let config = parserConfig[opt];
        if (config === undefined) {
            if (workerRange !== undefined)
                throw Error("Invalid worker option: " + name);
            return false;
        }
        let v = config.parse(value, config.name);
        if (workerRange === undefined)
            config.setGlobally(this.#params, v);
        else {
            if (config.setOnWorker === undefined)
                throw Error("Parameter cannot be used for individual workers: " + name);
            for (let i = workerRange[0]; i <= workerRange[1]; i++)
                config.setOnWorker(this.#getOrCreateWorker(i), v);
        }
        return true;
    }
    parse(options) {
        let i = 0;
        while (i < options.length) {
            let opt = options[i];
            if (!opt.startsWith("--")) {
                this.#addUnrecognized(opt);
                i++;
                continue;
            }
            let splitPoint = opt.indexOf("=");
            if (splitPoint != -1) {
                if (!this.#applyParameter(opt.slice(0, splitPoint), opt.slice(splitPoint + 1)))
                    this.#addUnrecognized(options[i]);
                i++;
                continue;
            }
            if (i == options.length - 1) {
                if (!this.#unknownAllowed)
                    throw Error("Missing value for command line option: " + opt);
                this.#addUnrecognized(options[i]);
                i++;
                continue;
            }
            if (this.#applyParameter(opt, options[i + 1]))
                i += 2;
            else {
                this.#addUnrecognized(options[i]);
                i++;
            }
        }
    }
    // In case of error print it and kill the process
    parseNoThrow(options) {
        try {
            this.parse(options);
        }
        catch (e) {
            if (e instanceof Error)
                console.error('Error: ', e.message);
            else
                console.error('Unknown exception while parsing command-line arguments: ', e);
            process.exit(1);
        }
    }
}
;
/**
 * Solution of a {@link Model}. When a model is solved, the solution is stored
 * in this object. The solution contains values of all variables in the model
 * (including optional variables) and the value of the objective (if the model
 * specified one).
 *
 * ### Preview version of OptalCP
 *
 * Note that in the preview version of OptalCP, the values of variables in
 * the solution are masked and replaced by value _absent_ (`null` in JavaScript).
 *
 * @group Solving
 */
export class Solution {
    #values;
    #objective;
    /**
     * Creates an empty solution. That is, all variables are absent, and the
     * objective value is _undefined_.
     *
     * Use this function to create an external solution that can be passed to
     * the solver before the solve starts as a _warmStart_ (see {@link solve},
     * {@link Solver}) or during the solve using {@link Solver.sendSolution}.
     */
    constructor() {
        this.#values = [];
        this.#objective = undefined;
    }
    /** @internal (read from a message sent by the solver) */
    _init(msg) {
        this.#values = [];
        for (var v of msg.values)
            this.#values[v.id] = v.value;
        this.#objective = msg.objective;
    }
    /**
     * Returns the objective value of the solution. If the model did not specify an
     * objective returns _undefined_. If the objective value is _absent_
     * (see optional {@link IntExpr}) then it returns _null_.
     *
     * The correct value is reported even in the preview version of OptalCP.
     */
    getObjective() { return this.#objective; }
    /** @internal */
    isPresent(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#values[variable._getId()] !== null;
    }
    isAbsent(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#values[variable._getId()] === null;
    }
    getValue(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        let result = this.#values[variable._getId()];
        if (!(variable instanceof BoolVar))
            return result;
        if (result === null)
            return null;
        return result === 1;
    }
    /**
     * Returns the start of the given interval variable in the solution.
     * If the variable is absent in the solution, it returns _null_.
     *
     * In the preview version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value _absent_.
     */
    getStart(variable) {
        const value = this.#values[variable._getId()];
        if (value !== null)
            return value.start;
        return null;
    }
    /**
     * Returns the end of the given interval variable in the solution.
     * If the variable is absent in the solution, it returns _null_.
     *
     * In the preview version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value _absent_.
     */
    getEnd(variable) {
        const value = this.#values[variable._getId()];
        if (value !== null)
            return value.end;
        return null;
    }
    /**
     * Sets objective value of the solution.
     *
     * This function
     * can be used for construction of an external solution that can be passed to
     * the solver (see {@link solve}, {@link Solver} and {@link
     * Solver.sendSolution}).
     */
    setObjective(value) { this.#objective = value; }
    setAbsent(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't set values of auxiliary variables
        this.#values[variable._getId()] = null;
    }
    setValue(variable, ...args) {
        assert(!variable._getProps().func.startsWith("_")); // Can't set values of auxiliary variables
        if (variable instanceof IntervalVar)
            this.#values[variable._getId()] = { start: args[0], end: args[1] };
        else
            this.#values[variable._getId()] = +args[0]; // Plus converts boolean to number
    }
    /** @internal */
    _serialize() {
        let values = [];
        for (const key in this.#values) {
            const v = this.#values[key];
            const id = parseInt(key);
            values.push({ id: id, value: v });
        }
        return { objective: this.#objective, values: values };
    }
}
/**
 * @internal
 *
 * Variable domains after propagation.
 *
 * Function {@link propagate} computes variable domains after propagation.
 * This class holds the computed domains (see {@link PropagationResult.domains}).
 *
 * Propagation removes inconsistent values from domains of variables using
 * constraint propagation. It does not fix variables to values (in general).
 *
 * For each variable, this class provides a way to query the computed domain,
 * e.g. using function {@link ModelDomains.getStartMin}.
 *
 * @group Propagation
 */
export class ModelDomains {
    #domains;
    /** @internal */
    constructor(domains) {
        this.#domains = [];
        for (let v of domains)
            this.#domains[v.id] = v.domain;
    }
    /** @internal */
    isPresent(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#domains[v._getId()].presence == 1 /* PresenceStatus.Present */;
    }
    /** @internal */
    isAbsent(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#domains[v._getId()].presence == 2 /* PresenceStatus.Absent */;
    }
    /** @internal */
    isOptional(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#domains[v._getId()].presence == 0 /* PresenceStatus.Optional */;
    }
    /** @internal */
    getMin(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.min ?? IntVarMin;
    }
    /** @internal */
    getMax(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.max ?? IntVarMax;
    }
    /**
     * Returns the minimum start time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getStartMin(v) {
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.startMin ?? IntervalMin;
    }
    /**
     * Returns the maximum start time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getStartMax(v) {
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.startMax ?? IntervalMax;
    }
    /**
     * Returns the minimum end time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getEndMin(v) {
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.endMin ?? IntervalMin;
    }
    /**
     * Returns the maximum end time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getEndMax(v) {
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.endMax ?? IntervalMax;
    }
    /**
     * Returns the minimum length of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getLengthMin(v) {
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.lengthMin ?? 0;
    }
    /**
     * Returns the maximum length of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getLengthMax(v) {
        const domain = this.#domains[v._getId()];
        if (domain.presence === 2 /* PresenceStatus.Absent */)
            return null;
        return domain.lengthMax ?? LengthMax;
    }
}
;
// === Class Model ===========================================================
/**
 * _Model_ captures the problem to be solved. It contains variables,
 * constraints and objective function.
 *
 * To create an optimization model, you must first create a _Model_ object.
 * Then you can use the methods of the _Model_ to create variables (e.g.  {@link
 * intervalVar}), the objective function ({@link minimize} or {@link maximize})
 * and constraints (e.g. {@link constraint} or {@link noOverlap}).
 * Note that a boolean expression becomes a constraint only by passing it to
 * the function {@link constraint}; otherwise, it is not enforced.
 *
 * To solve a model, pass it to function {@link solve} or to {@link Solver}
 * class.
 *
 * ### Available modeling elements
 *
 * #### Variables
 *
 * Interval variables can be created by function {@link intervalVar}, integer variables by function {@link intVar}.
 *
 * #### Basic integer expressions
 *
 * * {@link startOf}: start of an interval variable (optional integer expression).
 * * {@link startOr}: start of an interval variable or a constant when it is _absent_.
 * * {@link endOf}:   end of an interval variable (optional integer expression).
 * * {@link endOr}:   end of an interval variable or a constant when it is _absent_.
 * * {@link lengthOf}: length of an interval variable (optional integer expression).
 * * {@link lengthOr}: length of an interval variable or a constant when it is _absent_.
 * * {@link guard}: replaces _absent_ value by a constant.
 *
 * #### Integer arithmetics
 *
 * * {@link plus}:  addition.
 * * {@link minus}: subtraction.
 * * {@link neg}:   negation (changes sign).
 * * {@link times}: multiplication.
 * * {@link div}:   division (rounds to zero).
 * * {@link abs}:   absolute value.
 * * {@link min2}:  minimum of two integer expressions.
 * * {@link min}:   minimum of an array of integer expressions.
 * * {@link max2}:  maximum of two integer expressions.
 * * {@link max}:   maximum of an array of integer expressions.
 * * {@link sum}:   sum of an array of integer expressions.
 *
 * #### Comparison operators for integer expressions
 *
 * * {@link eq}: equality.
 * * {@link ne}: inequality.
 * * {@link lt}: less than.
 * * {@link le}: less than or equal to.
 * * {@link gt}: greater than.
 * * {@link ge}: greater than or equal to.
 * * {@link identity}: constraints two integer expressions to be equal, including the presence status.
 *
 * #### Boolean operators
 *
 * * {@link not}: negation.
 * * {@link and}: conjunction.
 * * {@link or}:  disjunction.
 * * {@link implies}: implication.
 *
 * #### Functions returning {@link BoolExpr}
 *
 * * {@link presenceOf}: whether the argument is _present_ or _absent_.
 * * {@link inRange}: whether an integer expression is within the given range
 *
 * #### Basic constraints on interval variables
 *
 * * {@link alternative}: an alternative between multiple interval variables.
 * * {@link span}: span (cover) of interval variables.
 * * {@link endBeforeEnd}, {@link endBeforeStart}, {@link startBeforeEnd}, {@link startBeforeStart},
 *   {@link endAtStart}, {@link startAtEnd}: precedence constraints.
 *
 * #### Disjunction (noOverlap)
 *
 *  * {@link sequenceVar}: sequence variable over a set of interval variables.
 *  * {@link noOverlap}: constraints a set of interval variables to not overlap (possibly with transition times).
 *  * {@link position}: returns the position of an interval variable in a sequence.
 *
 * #### Basic cumulative expressions
 *
 * * {@link pulse}: changes value during the interval variable.
 * * {@link stepAtStart}: changes value at the start of the interval variable.
 * * {@link stepAtEnd}: changes value at the end of the interval variable.
 * * {@link stepAt}: changes value at a given time.
 *
 * #### Combining cumulative expressions
 *
 * * {@link cumulNeg}: negation.
 * * {@link cumulPlus}: addition.
 * * {@link cumulMinus}: subtraction.
 * * {@link cumulSum}: sum of multiple expressions.
 *
 * #### Constraints on cumulative expressions
 *
 * * {@link cumulGe}: greater than or equal to a constant.
 * * {@link cumulLe}: less than or equal to a constant.
 *
 * #### Mapping/batching
 *
 * * {@link itvMapping}: map tasks (interval variables) to slots (other interval variables).
 *
 * #### Constraints on integer variables/expressions
 *
 * * {@link pack}: pack items of various sizes into a set of bins.
 *
 * #### Objective
 *
 * * {@link minimize}: minimize an integer expression.
 * * {@link maximize}: maximize an integer expression.
 *
 * @example
 *
 * Our goal is to schedule a set of tasks such that it is finished as soon as
 * possible (i.e., the makespan is minimized).  Each task has a fixed duration, and
 * cannot be interrupted.  Moreover, each task needs a certain number of
 * workers to be executed, and the total number of workers is limited.
 * The input data are generated randomly.
 *
 * ```ts
 * import * as CP from '@scheduleopt/optalcp';
 *
 * // Constants for random problem generation:
 * const nbTasks = 100;
 * const nbWorkers = 5;
 * const maxDuration = 100;
 *
 * // Start by creating the model:
 * let model = new CP.Model();
 *
 * // For each task we will have an interval variable and a cumulative expression:
 * let tasks : CP.IntervalVar[] = [];
 * let workerUsage: CP.CumulExpr[] = [];
 *
 * // Loop over the tasks:
 * for (let i = 0; i < nbTasks; i++) {
 *   // Generate random task length:
 *   const taskLength = 1 + Math.floor(Math.random() * (maxDuration - 1));
 *   // Create the interval variable for the task:
 *   let task = model.intervalVar({ name: "Task" + (i + 1), length: taskLength });
 *   // And store it in the array:
 *   tasks.push(task);
 *   // Generate random number of workers needed for the task:
 *   const workersNeeded = 1 + Math.floor(Math.random() * (nbWorkers - 1));
 *   // Create the pulse that increases the number of workers used during the task:
 *   workerUsage.push(task.pulse(workersNeeded));
 * }
 *
 * // Limit the sum of the pulses to the number of workers available:
 * model.cumulSum(workerUsage).cumulLe(nbWorkers);
 * // From an array of tasks, create an array of their ends:
 * let ends = tasks.map(t => t.end());
 * // And minimize the maximum of the ends:
 * model.max(ends).minimize();
 *
 * try {
 *   // Solve the model with the provided parameters:
 *   let result = await CP.solve(model, {
 *     timeLimit: 3, // Stop after 3 seconds
 *     nbWorkers: 4, // Use for CPU threads
 *   });
 *
 *   if (result.nbSolutions == 0)
 *     console.log("No solution found.");
 *   else {
 *     const solution = result.bestSolution!;
 *     // Note that in the preview version of the solver, the variable values in
 *     // the solution are masked, i.e. they are all _absent_ (`null` in JavaScript).
 *     // Objective value is not masked though.
 *     console.log("Solution found with makespan " + solution.getObjective());
 *     for (let task of tasks) {
 *       let start = solution.getStart(task);
 *       if (start !== null)
 *         console.log("Task " + task.getName() + " starts at " + );
 *       else
 *         console.log("Task " + task.getName() + " is absent (not scheduled).")
 *     }
 *   }
 *
 * } catch (e) {
 *   // In case of error, CP.solve returns a rejected promise.
 *   // Therefore, "await CP.solve" throws an exception.
 *   console.log("Error: " + (e as Error).message);
 * }
 * ```
 *
 * @see {@link solve}
 * @see {@link Solution}
 * @see {@link Solver}
 *
 * @group Modeling
 */
export class Model {
    #model = [];
    #name;
    #refs = [];
    #objective;
    #primaryObjectiveExpr;
    #knownArrays = new Map;
    #boolVars = [];
    #intVars = [];
    #floatVars = [];
    #intervalVars = [];
    /**
     * Creates a new empty model.
     *
     * Naming the model is optional.  The main purpose of the name is to
     * distinguish between different models during benchmarking (see {@link benchmark}).
     *
     * @param name Name of the model.
     */
    constructor(name) {
        this.#name = name;
    }
    // Include generated API for the model:
    /** @internal */
    _reusableBoolExpr(value) {
        let outParams = [GetBoolExpr(value)];
        const result = new BoolExpr(this, "reusableBoolExpr", outParams);
        return result;
    }
    /** @internal */
    _reusableIntExpr(value) {
        let outParams = [GetIntExpr(value)];
        const result = new IntExpr(this, "reusableIntExpr", outParams);
        return result;
    }
    /** @internal */
    _reusableFloatExpr(value) {
        let outParams = [GetFloatExpr(value)];
        const result = new FloatExpr(this, "reusableFloatExpr", outParams);
        return result;
    }
    /**
    * Negation of the boolean expression `arg`.
    *
    * @remarks
    *
    * If the argument has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link BoolExpr.not | BoolExpr.not}. */
    not(arg) {
        let outParams = [GetBoolExpr(arg)];
        const result = new BoolExpr(this, "boolNot", outParams);
        return result;
    }
    /**
    * Logical _OR_ of boolean expressions `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link BoolExpr.or | BoolExpr.or}. */
    or(arg1, arg2) {
        let outParams = [GetBoolExpr(arg1), GetBoolExpr(arg2)];
        const result = new BoolExpr(this, "boolOr", outParams);
        return result;
    }
    /**
    * Logical _AND_ of boolean expressions `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link BoolExpr.and | BoolExpr.and}. */
    and(arg1, arg2) {
        let outParams = [GetBoolExpr(arg1), GetBoolExpr(arg2)];
        const result = new BoolExpr(this, "boolAnd", outParams);
        return result;
    }
    /**
    * Logical implication of two boolean expressions, that is `arg1` implies `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link BoolExpr.implies | BoolExpr.implies}. */
    implies(arg1, arg2) {
        let outParams = [GetBoolExpr(arg1), GetBoolExpr(arg2)];
        const result = new BoolExpr(this, "boolImplies", outParams);
        return result;
    }
    /** @internal */
    _eq(arg1, arg2) {
        let outParams = [GetBoolExpr(arg1), GetBoolExpr(arg2)];
        const result = new BoolExpr(this, "boolEq", outParams);
        return result;
    }
    /** @internal */
    _ne(arg1, arg2) {
        let outParams = [GetBoolExpr(arg1), GetBoolExpr(arg2)];
        const result = new BoolExpr(this, "boolNe", outParams);
        return result;
    }
    /** @internal */
    _nand(arg1, arg2) {
        let outParams = [GetBoolExpr(arg1), GetBoolExpr(arg2)];
        const result = new BoolExpr(this, "boolNand", outParams);
        return result;
    }
    /**
    * Creates an expression that replaces value _absent_ by a constant.
    *
    * @remarks
    * The resulting expression is:
    *
    * * equal to `arg` if `arg` is _present_
    * * and equal to `absentValue` otherwise (i.e. when `arg` is _absent_).
    *
    * The default value of `absentValue` is 0.
    *
    * The resulting expression is never _absent_.
    *
    * Same as {@link IntExpr.guard | IntExpr.guard}. */
    guard(arg, absentValue = 0) {
        let outParams = [GetIntExpr(arg), GetInt(absentValue)];
        const result = new IntExpr(this, "intGuard", outParams);
        return result;
    }
    /**
    * Creates negation of the integer expression, i.e. `-arg`.
    *
    * @remarks
    *
    * If the value of `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link IntExpr.neg | IntExpr.neg}. */
    neg(arg) {
        let outParams = [GetIntExpr(arg)];
        const result = new IntExpr(this, "intNeg", outParams);
        return result;
    }
    /**
    * Creates an addition of the two integer expressions, i.e. `arg1 + arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.plus | IntExpr.plus}. */
    plus(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "intPlus", outParams);
        return result;
    }
    /**
    * Creates a subtraction of the two integer expressions, i.e. `arg1 + arg2`.@remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.minus | IntExpr.minus}. */
    minus(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "intMinus", outParams);
        return result;
    }
    /**
    * Creates a multiplication of the two integer expressions, i.e. `arg1 * arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.times | IntExpr.times}. */
    times(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "intTimes", outParams);
        return result;
    }
    /**
    * Creates an integer division of the two integer expressions, i.e. `arg1 div arg2`. The division rounds towards zero.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.div | IntExpr.div}. */
    div(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "intDiv", outParams);
        return result;
    }
    /** @internal */
    _modulo(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "modulo", outParams);
        return result;
    }
    /**
    * Constraints `arg1` and `arg2` to be identical, including their presence status.
    *
    * @remarks
    *
    * Identity is different than equality. For example, if `x` is _absent_, then `eq(x, 0)` is _absent_, but `identity(x, 0)` is _false_.
    *
    * Same as {@link IntExpr.identity | IntExpr.identity}. */
    identity(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new Constraint(this, "intIdentity", outParams);
    }
    /**
    * Creates Boolean expression `arg1` = `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.eq | IntExpr.eq}. */
    eq(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new BoolExpr(this, "intEq", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `arg1` &ne; `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.ne | IntExpr.ne}. */
    ne(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new BoolExpr(this, "intNe", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `arg1` < `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.lt | IntExpr.lt}. */
    lt(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new BoolExpr(this, "intLt", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `arg1` &le; `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.le | IntExpr.le}. */
    le(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new BoolExpr(this, "intLe", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `arg1` > `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.gt | IntExpr.gt}. */
    gt(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new BoolExpr(this, "intGt", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `arg1` &ge; `arg2`.
    *
    * @remarks
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.ge | IntExpr.ge}. */
    ge(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new BoolExpr(this, "intGe", outParams);
        return result;
    }
    /**
    * Creates Boolean expression `lb` &le; `arg` &le; `ub`.
    *
    * @remarks
    *
    * If `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.inRange | IntExpr.inRange}. */
    inRange(arg, lb, ub) {
        let outParams = [GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        const result = new BoolExpr(this, "intInRange", outParams);
        return result;
    }
    /** @internal */
    _notInRange(arg, lb, ub) {
        let outParams = [GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        const result = new BoolExpr(this, "intNotInRange", outParams);
        return result;
    }
    /**
    * Creates an integer expression which is absolute value of `arg`.
    *
    * @remarks
    *
    * If `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link IntExpr.abs | IntExpr.abs}. */
    abs(arg) {
        let outParams = [GetIntExpr(arg)];
        const result = new IntExpr(this, "intAbs", outParams);
        return result;
    }
    /**
    * Creates an integer expression which is the minimum of `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.min2 | IntExpr.min2}. See {@link Model.min | Model.min} for n-ary minimum. */
    min2(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "intMin2", outParams);
        return result;
    }
    /**
    * Creates an integer expression which is the maximum of `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.max2 | IntExpr.max2}. See {@link Model.max | Model.max} for n-ary maximum. */
    max2(arg1, arg2) {
        let outParams = [GetIntExpr(arg1), GetIntExpr(arg2)];
        const result = new IntExpr(this, "intMax2", outParams);
        return result;
    }
    /** @internal */
    _square(arg) {
        let outParams = [GetIntExpr(arg)];
        const result = new IntExpr(this, "intSquare", outParams);
        return result;
    }
    /**
    * Creates in integer expression for the sum of the arguments.
    *
    * @remarks
    *
    * Absent arguments are ignored (treated as zeros). Therefore, the resulting expression is never _absent_.
    *
    * Note that binary function {@link Model.plus} handles absent values differently. For example, when `x` is _absent_ then:
    *
    * * `plus(x, 3)` is _absent_.
    * * `sum([x, 3])` is 3.
    *
    * @example
    *
    * Let's consider a set of optional tasks. Due to limited resources and time, only some of them can be executed. Every task has a profit, and we want to maximize the total profit from the executed tasks.
    *
    * ```ts
    * // Lengths and profits of the tasks:
    * const lengths = [10, 20, 15, 30, 20, 25, 30, 10, 20, 25];
    * const profits = [ 5,  6,  7,  8,  9, 10, 11, 12, 13, 14];
    *
    * let model = new CP.Model;
    * let tasks: CP.IntervalVar[] = [];
    * // Profits of individual tasks. The value will be zero if the task is not executed.
    * let taskProfits: CP.IntExpr[] = [];
    *
    * for (let i = 0; i < lengths.length; i++) {
    *   // All tasks must finish before time 100:
    *   let task = model.intervalVar({ name: "Task" + i, optional: true, length: lengths[i], end: [, 100]});
    *   tasks.push(task);
    *   taskProfits.push(model.times(task.presence(), profits[i]));
    * }
    * model.sum(taskProfits).maximize();
    * // Tasks cannot overlap:
    * model.noOverlap(tasks);
    *
    * let result = await CP.solve(model, { searchType: "FDS" });
    * ```
    *  */
    sum(args) {
        let outParams = [this._getIntExprArray(args)];
        const result = new IntExpr(this, "intSum", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the maximum of the arguments.
    *
    * @remarks
    *
    * Absent arguments are ignored as if they were not specified in the input array `args`. Maximum of an empty set (i.e. `max([])` is _absent_. The maximum is _absent_ also if all arguments are _absent_.
    *
    * Note that binary function {@link Model.max2} handles absent values differently. For example, when `x` is _absent_ then:
    *
    * * `max2(x, 5)` is _absent_.
    * * `max([x, 5])` is 5.
    * * `max([x])` is _absent_.
    *
    * @example
    *
    * A common use case is to compute _makespan_ of a set of tasks, i.e. the time when the last task finishes. In the following example, we minimize the makespan of a set of tasks (other parts of the model are omitted).
    *
    * ```ts
    * let model = new CP.Model;
    * let tasks: CP.IntervalVar[] = ...;
    * ...
    * // Create an array of end times of the tasks:
    * let endTimes = tasks.map(task => task.end());
    * let makespan = model.max(endTimes);
    * model.minimize(makespan);
    * ```
    * Notice that when a task is _absent_ (not executed), then its end time is _absent_. And therefore, the absent task is not included in the maximum.
    *
    * @see Binary {@link Model.max2}.
    * @see Function {@link Model.span} constraints interval variable to start and end at minimum and maximum of the given set of intervals.
    *
    *  */
    max(args) {
        let outParams = [this._getIntExprArray(args)];
        const result = new IntExpr(this, "intMax", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the minimum of the arguments.
    *
    * @remarks
    *
    * Absent arguments are ignored as if they were not specified in the input array `args`. Minimum of an empty set (i.e. `min([])` is _absent_. The minimum is _absent_ also if all arguments are _absent_.
    *
    * Note that binary function {@link Model.min2} handles absent values differently. For example, when `x` is _absent_ then:
    *
    * * `min2(x, 5)` is _absent_.
    * * `min([x, 5])` is 5.
    * * `min([x])` is _absent_.
    *
    * @example
    *
    * In the following example, we compute the time when the first task of `tasks` starts, i.e. the minimum of the starting times.
    *
    * ```ts
    * let model = new CP.Model;
    * let tasks: CP.IntervalVar[] = ...;
    * ...
    * // Create an array of start times of the tasks:
    * let startTimes = tasks.map(task => task.start());
    * let firstStartTime = model.min(startTimes);
    * ```
    * Notice that when a task is _absent_ (not executed), its end time is _absent_. And therefore, the absent task is not included in the minimum.
    *
    * @see Binary {@link Model.min2}.
    * @see Function {@link Model.span} constraints interval variable to start and end at minimum and maximum of the given set of intervals.
    *
    *  */
    min(args) {
        let outParams = [this._getIntExprArray(args)];
        const result = new IntExpr(this, "intMin", outParams);
        return result;
    }
    /** @internal */
    _intPresentLinearExpr(coefficients, expressions, constantTerm = 0) {
        let outParams = [this._getIntArray(coefficients), this._getIntExprArray(expressions), GetInt(constantTerm)];
        const result = new IntExpr(this, "intPresentLinearExpr", outParams);
        return result;
    }
    /** @internal */
    _intOptionalLinearExpr(coefficients, expressions, constantTerm = 0) {
        let outParams = [this._getIntArray(coefficients), this._getIntExprArray(expressions), GetInt(constantTerm)];
        const result = new IntExpr(this, "intOptionalLinearExpr", outParams);
        return result;
    }
    /** @internal */
    _count(expressions, value) {
        let outParams = [this._getIntExprArray(expressions), GetInt(value)];
        const result = new IntExpr(this, "intCount", outParams);
        return result;
    }
    /** @internal */
    _element(array, subscript) {
        let outParams = [this._getIntArray(array), GetIntExpr(subscript)];
        const result = new IntExpr(this, "intElement", outParams);
        return result;
    }
    /** @internal */
    _exprElement(expressions, subscript) {
        let outParams = [this._getIntExprArray(expressions), GetIntExpr(subscript)];
        const result = new IntExpr(this, "intExprElement", outParams);
        return result;
    }
    /** @internal */
    _floatIdentity(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new Constraint(this, "floatIdentity", outParams);
    }
    /** @internal */
    _floatGuard(arg, absentValue = 0) {
        let outParams = [GetFloatExpr(arg), GetFloat(absentValue)];
        const result = new FloatExpr(this, "floatGuard", outParams);
        return result;
    }
    /** @internal */
    _floatNeg(arg) {
        let outParams = [GetFloatExpr(arg)];
        const result = new FloatExpr(this, "floatNeg", outParams);
        return result;
    }
    /** @internal */
    _floatPlus(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new FloatExpr(this, "floatPlus", outParams);
        return result;
    }
    /** @internal */
    _floatMinus(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new FloatExpr(this, "floatMinus", outParams);
        return result;
    }
    /** @internal */
    _floatTimes(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new FloatExpr(this, "floatTimes", outParams);
        return result;
    }
    /** @internal */
    _floatDiv(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new FloatExpr(this, "floatDiv", outParams);
        return result;
    }
    /** @internal */
    _floatEq(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new BoolExpr(this, "floatEq", outParams);
        return result;
    }
    /** @internal */
    _floatNe(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new BoolExpr(this, "floatNe", outParams);
        return result;
    }
    /** @internal */
    _floatLt(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new BoolExpr(this, "floatLt", outParams);
        return result;
    }
    /** @internal */
    _floatLe(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new BoolExpr(this, "floatLe", outParams);
        return result;
    }
    /** @internal */
    _floatGt(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new BoolExpr(this, "floatGt", outParams);
        return result;
    }
    /** @internal */
    _floatGe(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new BoolExpr(this, "floatGe", outParams);
        return result;
    }
    /** @internal */
    _floatInRange(arg, lb, ub) {
        let outParams = [GetFloatExpr(arg), GetFloat(lb), GetFloat(ub)];
        const result = new BoolExpr(this, "floatInRange", outParams);
        return result;
    }
    /** @internal */
    _floatNotInRange(arg, lb, ub) {
        let outParams = [GetFloatExpr(arg), GetFloat(lb), GetFloat(ub)];
        const result = new BoolExpr(this, "floatNotInRange", outParams);
        return result;
    }
    /** @internal */
    _floatAbs(arg) {
        let outParams = [GetFloatExpr(arg)];
        const result = new FloatExpr(this, "floatAbs", outParams);
        return result;
    }
    /** @internal */
    _floatSquare(arg) {
        let outParams = [GetFloatExpr(arg)];
        const result = new FloatExpr(this, "floatSquare", outParams);
        return result;
    }
    /** @internal */
    _floatMin2(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new FloatExpr(this, "floatMin2", outParams);
        return result;
    }
    /** @internal */
    _floatMax2(arg1, arg2) {
        let outParams = [GetFloatExpr(arg1), GetFloatExpr(arg2)];
        const result = new FloatExpr(this, "floatMax2", outParams);
        return result;
    }
    /** @internal */
    _floatSum(args) {
        let outParams = [this._getFloatExprArray(args)];
        const result = new FloatExpr(this, "floatSum", outParams);
        return result;
    }
    /** @internal */
    _floatMax(args) {
        let outParams = [this._getFloatExprArray(args)];
        const result = new FloatExpr(this, "floatMax", outParams);
        return result;
    }
    /** @internal */
    _floatMin(args) {
        let outParams = [this._getFloatExprArray(args)];
        const result = new FloatExpr(this, "floatMin", outParams);
        return result;
    }
    /** @internal */
    _floatPresentLinearExpr(coefficients, expressions, constantTerm) {
        let outParams = [this._getFloatArray(coefficients), this._getFloatExprArray(expressions), GetFloat(constantTerm)];
        const result = new FloatExpr(this, "floatPresentLinearExpr", outParams);
        return result;
    }
    /** @internal */
    _floatOptionalLinearExpr(coefficients, expressions, constantTerm) {
        let outParams = [this._getFloatArray(coefficients), this._getFloatExprArray(expressions), GetFloat(constantTerm)];
        const result = new FloatExpr(this, "floatOptionalLinearExpr", outParams);
        return result;
    }
    /** @internal */
    _floatElement(array, subscript) {
        let outParams = [this._getFloatArray(array), GetIntExpr(subscript)];
        const result = new FloatExpr(this, "floatElement", outParams);
        return result;
    }
    /** @internal */
    lexLe(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        const result = new Constraint(this, "intLexLe", outParams);
    }
    /** @internal */
    lexLt(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        const result = new Constraint(this, "intLexLt", outParams);
    }
    /** @internal */
    lexGe(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        const result = new Constraint(this, "intLexGe", outParams);
    }
    /** @internal */
    lexGt(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        const result = new Constraint(this, "intLexGt", outParams);
    }
    /**
    * Creates an integer expression for the start of an interval variable.
    *
    * @remarks
    *
    * If the interval is absent, the resulting expression is also absent.
    *
    * @example
    *
    * In the following example, we constraint interval variable `y` to start after the end of `y` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
    *
    * ```ts
    * let model = new CP.Model;
    * let x = model.intervalVar({ name: "x", ... });
    * let y = model.intervalVar({ name: "y", ... });
    * model.constraint(model.endOf(x).plus(10).le(model.startOf(y)));
    * model.constraint(model.lengthOf(x).le(model.lengthOf(y)));
    * ```
    *
    * When `x` or `y` is _absent_ then value of both constraints above is _absent_ and therefore they are satisfied.
    *
    * @see {@link IntervalVar.start} is equivalent function on {@link IntervalVar}.
    * @see Function {@link Model.startOr} is a similar function that replaces value _absent_ by a constant.
    *  */
    startOf(interval) {
        let outParams = [GetIntervalVar(interval)];
        const result = new IntExpr(this, "startOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the end of an interval variable.
    *
    * @remarks
    *
    * If the interval is absent, the resulting expression is also absent.
    *
    * @example
    *
    * In the following example, we constraint interval variable `y` to start after the end of `y` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
    *
    * ```ts
    * let model = new CP.Model;
    * let x = model.intervalVar({ name: "x", ... });
    * let y = model.intervalVar({ name: "y", ... });
    * model.constraint(model.endOf(x).plus(10).le(model.startOf(y)));
    * model.constraint(model.lengthOf(x).le(model.lengthOf(y)));
    * ```
    *
    * When `x` or `y` is _absent_ then value of both constraints above is _absent_ and therefore they are satisfied.
    *
    * @see {@link IntervalVar.end} is equivalent function on {@link IntervalVar}.
    * @see Function {@link Model.endOr} is a similar function that replaces value _absent_ by a constant.
    *  */
    endOf(interval) {
        let outParams = [GetIntervalVar(interval)];
        const result = new IntExpr(this, "endOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the length of an interval variable.
    *
    * @remarks
    *
    * If the interval is absent, the resulting expression is also absent.
    *
    * @example
    *
    * In the following example, we constraint interval variable `y` to start after the end of `y` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
    *
    * ```ts
    * let model = new CP.Model;
    * let x = model.intervalVar({ name: "x", ... });
    * let y = model.intervalVar({ name: "y", ... });
    * model.constraint(model.endOf(x).plus(10).le(model.startOf(y)));
    * model.constraint(model.lengthOf(x).le(model.lengthOf(y)));
    * ```
    *
    * When `x` or `y` is _absent_ then value of both constraints above is _absent_ and therefore they are satisfied.
    *
    * @see {@link IntervalVar.length} is equivalent function on {@link IntervalVar}.
    * @see Function {@link Model.lengthOr} is a similar function that replaces value _absent_ by a constant.
    *  */
    lengthOf(interval) {
        let outParams = [GetIntervalVar(interval)];
        const result = new IntExpr(this, "lengthOf", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the start of the interval variable. If the interval is absent, then its value is `absentValue`.
    *
    * @remarks
    *
    * This function is equivalent to `startOf(interval).guard(absentValue)`.
    *
    * @see {@link Model.startOf}
    * @see {@link Model.guard}
    *  */
    startOr(interval, absentValue) {
        let outParams = [GetIntervalVar(interval), GetInt(absentValue)];
        const result = new IntExpr(this, "startOr", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the end of the interval variable. If the interval is absent, then its value is `absentValue`.
    *
    * @remarks
    *
    * This function is equivalent to `endOf(interval).guard(absentValue)`.
    *
    * @see {@link Model.endOf}
    * @see {@link Model.guard}
    *  */
    endOr(interval, absentValue) {
        let outParams = [GetIntervalVar(interval), GetInt(absentValue)];
        const result = new IntExpr(this, "endOr", outParams);
        return result;
    }
    /**
    * Creates an integer expression for the length of the interval variable. If the interval is absent, then its value is `absentValue`.
    *
    * @remarks
    *
    * This function is equivalent to `lengthOf(interval).guard(absentValue)`.
    *
    * @see {@link Model.lengthOf}
    * @see {@link Model.guard}
    *  */
    lengthOr(interval, absentValue) {
        let outParams = [GetIntervalVar(interval), GetInt(absentValue)];
        const result = new IntExpr(this, "lengthOr", outParams);
        return result;
    }
    /** @internal */
    _overlapLength(interval1, interval2) {
        let outParams = [GetIntervalVar(interval1), GetIntervalVar(interval2)];
        const result = new IntExpr(this, "overlapLength", outParams);
        return result;
    }
    /** @internal */
    _alternativeCost(main, options, weights) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(options), this._getIntArray(weights)];
        const result = new IntExpr(this, "intAlternativeCost", outParams);
        return result;
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).le(successor.end())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be less than or equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.endBeforeEnd | IntervalVar.endBeforeEnd}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    endBeforeEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "endBeforeEnd", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).le(successor.start())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be less than or equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.endBeforeStart | IntervalVar.endBeforeStart}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    endBeforeStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "endBeforeStart", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).le(successor.end())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be less than or equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.startBeforeEnd | IntervalVar.startBeforeEnd}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    startBeforeEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "startBeforeEnd", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).le(successor.start())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be less than or equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.startBeforeStart | IntervalVar.startBeforeStart}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.le}
    *  */
    startBeforeStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "startBeforeStart", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).eq(successor.end())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.endAtEnd | IntervalVar.endAtEnd}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    endAtEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "endAtEnd", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.end().plus(delay).eq(successor.start())).
    * ```
    *
    * In other words, end of `predecessor` plus `delay` must be equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.endAtStart | IntervalVar.endAtStart}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    endAtStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "endAtStart", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).eq(successor.end())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be equal to end of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.startAtEnd | IntervalVar.startAtEnd}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    startAtEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "startAtEnd", outParams);
        this.constraint(result);
    }
    /**
    * Creates a precedence constraint between two interval variables.
    *
    * @remarks
    *
    * Same as:
    *
    * ```ts
    * model.constraint(predecessor.start().plus(delay).eq(successor.start())).
    * ```
    *
    * In other words, start of `predecessor` plus `delay` must be equal to start of `successor`.
    *
    * When one of the two interval variables is absent, then the constraint is satisfied.
    *
    * @see {@link IntervalVar.startAtStart | IntervalVar.startAtStart}      is equivalent function on {@link IntervalVar}.
    * @see {@link Model.constraint}
    * @see {@link IntervalVar.start}, {@link IntervalVar.end}
    * @see {@link IntExpr.eq}
    *  */
    startAtStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        const result = new Constraint(this, "startAtStart", outParams);
        this.constraint(result);
    }
    /**
    * Creates alternative constraint between interval variables.
    *
    * @param main The main interval variable.
    * @param options Array of optional interval variables to choose from.
    *
    * @remarks
    *
    * Alternative constraint is a way to model various kinds of choices. For example, we can model a task that could be done by worker A, B, or C. To model such alternative, we use interval variable `main` that represents the task regardless the chosen worker and three interval variables `options = [A, B, C]` that represent the task when done by worker A, B, or C. Interval variables `A`, `B`, and `C` should be optional. This way, if e.g. option B is chosen, then `B` will be _present_ and equal to `main` (they will start at the same time and end at the same time), the remaining options, A and C, will be _absent_.
    *
    * We may also decide not to execute the `main` task at all (if it is optional). Then `main` will be _absent_ and all options `A`, `B` and `C` will be _absent_ too.
    *
    * #### Formal definition
    *
    * The constraint `alternative(main, options)` is satisfied in the following two cases:
    * 1. Interval `main` is _absent_ and all `options[i]` are _absent_ too.
    * 2. Interval `main` is _present_ and exactly one of `options[i]` is _present_ (the remaining options are _absent_).    Let `k` be the index of the present option.    Then `main.start() == options[k].start()` and `main.end() == options[k].end()`.
    *
    * @example
    *
    * Let's consider task T, which can be done by workers A, B, or C. The length of the task and a cost associated with it depends on the chosen worker:
    *
    * * If done by worker A, then its length is 10, and the cost is 5.
    * * If done by worker B, then its length is 20, and the cost is 2.
    * * If done by worker C, then its length is 3, and the cost is 10.
    *
    * Each worker can execute only one task at a time. However, the remaining tasks are omitted in the model below. The objective could be, e.g., to minimize the total cost (also omitted in the model).
    *
    * ```ts
    * let model = new CP.Model;
    *
    * let T = model.intervalVar({ name: "T" });
    * let T_A = model.intervalVar({ name: "T_A", optional: true, length: 10 });
    * let T_B = model.intervalVar({ name: "T_B", optional: true, length: 20 });
    * let T_C = model.intervalVar({ name: "T_C", optional: true, length: 3 });
    *
    * // T_A, T_B and T_C are different ways to execute task T:
    * model.alternative(T, [T_A, T_B, T_C]);
    * // The cost depends on the chosen option:
    * let costOfT = model.sum([
    *   T_A.presence().times(5),
    *   T_B.presence().times(2),
    *   T_C.presence().times(10)
    * ]);
    *
    * // Each worker A can perform only one task at a time:
    * model.noOverlap([T_A, ...]);  // Worker A
    * model.noOverlap([T_B, ...]);  // Worker B
    * model.noOverlap([T_C, ...]);  // Worker C
    *
    * // Minimize the total cost:
    * model.sum([costOfT, ...]).minimize();
    * ```
    *
    *  */
    alternative(main, options) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(options)];
        const result = new Constraint(this, "alternative", outParams);
    }
    /** @internal */
    intervalVarElement(slots, index, value) {
        let outParams = [this._getIntervalVarArray(slots), GetIntExpr(index), GetIntervalVar(value)];
        const result = new Constraint(this, "intervalVarElement", outParams);
        this.constraint(result);
    }
    /** @internal */
    increasingIntervalVarElement(slots, index, value) {
        let outParams = [this._getIntervalVarArray(slots), GetIntExpr(index), GetIntervalVar(value)];
        const result = new Constraint(this, "increasingIntervalVarElement", outParams);
        this.constraint(result);
    }
    /**
    *
    * Map `tasks` on `slots` according to the `indices` array.
    *
    * @param tasks Array of interval variables to map.
    * @param slots Array of interval variables to map to.
    * @param indices Array of integer expressions that specify the mapping (of the same length as `tasks`).
    *
    * @remarks
    *
    * Each task is synchronized with the slot it is assigned to. Multiple tasks can be
    * assigned to the same slot. A slot without any task is _absent_. Absent tasks are
    * not assigned to any slot (their index value is _absent_).  Slots are sorted by
    * both start and end. Absent slots are at the end of the array.
    *
    * The constraint can be used to form batches of synchronized tasks (so-called
    * _p-batching_). In this case `slots` corresponds to batches. The size of the
    * batches can be limited using, e.g., {@link Model.pack} constraint.
    *
    * #### Formal definition
    *
    * Let $T$ be the number of tasks (the length of the
    * array `tasks`). The number of the indices must also be $T$ (arrays `tasks` and
    * `indices` must have the same length).  Let `tasks[t]` be one of the tasks, i.e.,
    * $\mathtt{t} \in \{0,1,\dots T-1\}$. Then `indices[t]` is the index of the slot
    * the task `tasks[t]` is assigned to.  Only present tasks are assigned:
    * $$
    * \mathtt{
    *   \forall t \in \mathrm{0,\dots,T-1:} \quad presenceOf(tasks[t]) \,\Leftrightarrow\, presenceOf(indices[t])
    * }
    * $$
    * Each task is synchronized with the slot to which it is assigned:
    * $$
    * \begin{aligned}
    * \mathtt{\forall t \in \mathrm{0,\dots,T-1} \text{ such that } tasks[t] \ne \text{absent:}} \\
    *     \mathtt{slots[indices[t]]} &\ne \textrm{absent} \\
    *     \mathtt{startOf(tasks[t])} &= \mathtt{startOf(slots[indices[t]]) }\\
    *     \mathtt{endOf(tasks[t])} &= \mathtt{endOf(slots[indices[t]])}
    * \end{aligned}
    * $$
    * A slot is present if and only if there is a task assigned to it:
    * $$
    * \forall \mathtt{s} \in 0,\dots,S-1:\;
    * \mathtt{presenceOf(tasks[s])} \;\Leftrightarrow\; (\exists \mathtt{t} \in 0,\dots,T-1: \mathtt{indices[t]=s})
    * $$
    * Absent slots are positioned at the end of the array:
    * $$
    * \mathtt{
    *    \forall s \in \mathrm{1,\dots,S-1}:\, presenceOf(slots[s]) \Rightarrow presenceOf(slots[s-1])
    * }
    * $$
    * Present slots are sorted by both start and end:
    * $$
    * \begin{aligned}
    * \mathtt{\forall s \in \mathrm{1,\dots,S-1} \text{ such that } slots[s] \ne \text{absent:}} \\
    *     \mathtt{startOf(slots[s-1])} &\le \mathtt{startOf(slots[s]) }
    *     \\
    *     \mathtt{endOf(slots[s-1])} &\le \mathtt{endOf(slots[s])}
    * \end{aligned}
    * $$
    *
    * The amount of the propagation for this constraint can be controlled by parameter
    * {@link Parameters.packPropagationLevel}.
    *
    * @see {@link Model.pack} for limiting the amount of tasks assigned to a slot.
    *  */
    itvMapping(tasks, slots, indices) {
        let outParams = [this._getIntervalVarArray(tasks), this._getIntervalVarArray(slots), this._getIntExprArray(indices)];
        const result = new Constraint(this, "itvMapping", outParams);
    }
    /**
    * Constraints an interval variable to span (cover) a set of other interval variables.
    *
    * @param main The spanning interval variable.
    * @param covered The set of interval variables to cover.
    *
    * @remarks
    *
    * Span constraint can be used to model, for example, a composite task that consists of several subtasks.
    *
    * The constraint makes sure that interval variable `main` starts with the first interval in `covered` and ends with the last interval in `covered`. Absent interval variables in `covered` are ignored.
    *
    * #### Formal definition
    *
    * Span constraint is satisfied in one of the following two cases:
    *
    * * Interval variable `main` is absent and all interval variables in `covered` are absent too.
    * * Interval variable `main` is present, at least one interval in `covered` is present and:
    *
    *    * `main.start()` is equal to the minimum starting time of all present intervals in `covered`.
    *    * `main.end()` is equal to the maximum ending time of all present intervals in `covered`.
    *
    * @example
    *
    * Let's consider composite task `T`, which consists of 3 subtasks: `T1`, `T2`, and `T3`. Subtasks are independent, could be processed in any order, and may overlap. However, task T is blocking a particular location, and no other task can be processed there. The location is blocked as soon as the first task from `T1`, `T2`, `T3` starts, and it remains blocked until the last one of them finishes.
    *
    * ```ts
    * let model = new CP.Model;
    *
    * // Subtasks have known lengths:
    * let T1 = model.intervalVar({ name: "T1", length: 10 });
    * let T2 = model.intervalVar({ name: "T2", length: 5 });
    * let T3 = model.intervalVar({ name: "T3", length: 15 });
    * // The main task has unknown length though:
    * let T = model.intervalVar({ name: "T" });
    *
    * // T spans/covers T1, T2 and T3:
    * model.span(T, [T1, T2, T3]);
    *
    * // Tasks requiring the same location cannot overlap.
    * // Other tasks are not included in the example, therefore '...' below:
    * model.noOverlap([T, ...]);
    * ```
    *
    * @see {@link IntervalVar.span | IntervalVar.span} is equivalent function on {@link IntervalVar}.
    *  */
    span(main, covered) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(covered)];
        const result = new Constraint(this, "span", outParams);
    }
    /** @internal */
    _noOverlap(sequence, transitions) {
        let outParams = [GetSequenceVar(sequence)];
        if (transitions !== undefined)
            outParams.push(this._getIntMatrix(transitions));
        const result = new Constraint(this, "noOverlap", outParams);
    }
    /**
    * Creates an expression equal to the position of the `interval` on the `sequence`.
    *
    * @remarks
    *
    * In the solution, the interval which is scheduled first has position 0, the second interval has position 1, etc. The position of an absent interval is `absent`.
    *
    * The `position` expression cannot be used with interval variables of possibly zero length (because the position of two simultaneous zero-length intervals would be undefined). Also, `position` cannot be used in case of {@link Model.noOverlap} constraint with transition times.
    *
    * @see {@link IntervalVar.position | IntervalVar.position} is equivalent function on {@link IntervalVar}.
    * @see {@link Model.noOverlap} for constraints on overlapping intervals.
    * @see {@link Model.sequenceVar} for creating sequence variables.
    *  */
    position(interval, sequence) {
        let outParams = [GetIntervalVar(interval), GetSequenceVar(sequence)];
        const result = new IntExpr(this, "position", outParams);
        return result;
    }
    /** @internal */
    _sameSequence(sequence1, sequence2) {
        let outParams = [GetSequenceVar(sequence1), GetSequenceVar(sequence2)];
        const result = new Constraint(this, "sameSequence", outParams);
    }
    /** @internal */
    _sameSequenceGroup(sequences) {
        let outParams = [this._getSequenceVarArray(sequences)];
        const result = new Constraint(this, "sameSequenceGroup", outParams);
    }
    /**
    *
    * Creates cumulative function (expression) _pulse_ for the given interval variable and height.
    *
    * @remarks
    *
    * Pulse can be used to model a resource requirement during an interval variable. The given amount `height` of the resource is used throughout the interval (from start to end).
    *
    * #### Formal definition
    *
    * Pulse creates a cumulative function which has the value:
    *
    * * `0` before `interval.start()`,
    * * `height` between `interval.start()` and `interval.end()`,
    * * `0` after `interval.end()`
    *
    * If `interval` is absent, the pulse is `0` everywhere.
    *
    * The `height` can be a constant value or an expression. In particular, the `height` can be given by an {@link IntVar}. In such a case, the `height` is unknown at the time of the model creation but is determined during the search.
    *
    * Note that the `interval` and the `height` may have different presence statuses (when the `height` is given by a variable or an expression). In this case, the pulse is present only if both the `interval` and the `height` are present. Therefore, it is helpful to constrain the `height` to have the same presence status as the `interval`.
    *
    * Cumulative functions can be combined using {@link Model.cumulPlus}, {@link Model.cumulMinus}, {@link Model.cumulNeg} and {@link Model.cumulSum}. A cumulative function's minimum and maximum height can be constrained using {@link Model.cumulLe} and {@link Model.cumulGe}.
    *
    * @example
    *
    * Let us consider a set of tasks and a group of 3 workers. Each task requires a certain number of workers (`nbWorkersNeeded`). Our goal is to schedule the tasks so that the length of the schedule (makespan) is minimal.
    *
    * ```ts
    * // The input data:
    * const nbWorkers = 3;
    * const tasks = [
    *   { length: 10, nbWorkersNeeded: 3},
    *   { length: 20, nbWorkersNeeded: 2},
    *   { length: 15, nbWorkersNeeded: 1},
    *   { length: 30, nbWorkersNeeded: 2},
    *   { length: 20, nbWorkersNeeded: 1},
    *   { length: 25, nbWorkersNeeded: 2},
    *   { length: 10, nbWorkersNeeded: 1},
    * ];
    *
    * let model = new CP.Model;
    * // A set of pulses, one for each task:
    * let pulses: CP.CumulExpr[] = [];
    * // End times of the tasks:
    * let ends: CP.IntExpr[] = [];
    *
    * for (let i = 0; i < tasks.length; i++) {
    *   // Create a task:
    *   let task = model.intervalVar({ name: "T" + (i+1), length: tasks[i].length} );
    *   // Create a pulse for the task:
    *   pulses.push(model.pulse(task, tasks[i].nbWorkersNeeded));
    *   // Store the end of the task:
    *   ends.push(task.end());
    * }
    *
    * // The number of workers used at any time cannot exceed nbWorkers:
    * model.cumulLe(model.cumulSum(pulses), nbWorkers);
    * // Minimize the maximum of the ends (makespan):
    * model.minimize(model.max(ends));
    *
    * let result = await CP.solve(model, { searchType: "FDS" });
    * ```
    *
    * @example
    *
    * In the following example, we create three interval variables `x`, `y`, and `z` that represent some tasks. Variables `x` and `y` are present, but variable `z` is optional. Each task requires a certain number of workers. The length of the task depends on the assigned number of workers. The number of assigned workers is modeled using integer variables `workersX`, `workersY`, and `workersZ`.
    *
    * There are 7 workers. Therefore, at any time, the sum of the workers assigned to the running tasks must be less or equal to 7.
    *
    * If the task `z` is absent, then the variable `workersZ` has no meaning, and therefore, it should also be absent.
    *
    * ```ts
    * let model = CP.Model;
    * let x = model.intervalVar({ name: "x" });
    * let y = model.intervalVar({ name: "y" });
    * let z = model.intervalVar({ name: "z", optional: true });
    *
    * let workersX = model.intVar({ range: [1, 5], name: "workersX" });
    * let workersY = model.intVar({ range: [1, 5], name: "workersY" });
    * let workersZ = model.intVar({ range: [1, 5], name: "workersZ", optional: true });
    *
    * // workersZ is present if an only if z is present:
    * model.constraint(z.presence().eq(workersZ.presence()));
    *
    * let pulseX = model.pulse(x, workersX);
    * let pulseY = model.pulse(y, workersY);
    * let pulseZ = model.pulse(z, workersZ);
    *
    * // There are at most 7 workers at any time:
    * model.cumulSum([pulseX, pulseY, pulseZ]).cumulLe(7);
    *
    * // Length of the task depends on the number of workers using the following formula:
    * //    length * workersX = 12
    * model.constraint(x.length().times(workersX).eq(12));
    * model.constraint(y.length().times(workersY).eq(12));
    * model.constraint(z.length().times(workersZ).eq(12));
    * ```
    *
    * @see {@link IntervalVar.pulse | IntervalVar.pulse} is equivalent function on {@link IntervalVar}.
    * @see {@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt} for other basic cumulative functions.
    * @see {@link Model.cumulLe} and {@link Model.cumulGe} for constraints on cumulative functions.
    *  */
    pulse(interval, height) {
        let outParams = [GetIntervalVar(interval), GetIntExpr(height)];
        const result = new CumulExpr(this, "pulse", outParams);
        return result;
    }
    /**
    *
    * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
    *
    * @remarks
    *
    * Cumulative _step_ functions could be used to model a resource that is consumed or produced and, therefore, changes in amount over time. Examples of such a resource are a battery, an account balance, a product's stock, etc.
    *
    * A `stepAtStart` can change the amount of such resource at the start of a given variable. The amount is changed by the given `height`, which can be positive or negative.
    *
    * The `height` can be a constant value or an expression. In particular, the `height` can be given by an {@link IntVar}. In such a case, the `height` is unknown at the time of the model creation but is determined during the search.
    *
    * Note that the `interval` and the `height` may have different presence statuses (when the `height` is given by a variable or an expression). In this case, the step is present only if both the `interval` and the `height` are present. Therefore, it is helpful to constrain the `height` to have the same presence status as the `interval`.
    *
    * Cumulative steps could be combined using {@link Model.cumulPlus},{@link Model.cumulMinus}, {@link Model.cumulNeg} and {@link Model.cumulSum}. A cumulative function's minimum and maximum height can be constrained using {@link Model.cumulLe} and {@link Model.cumulGe}.
    *
    * #### Formal definition
    *
    * stepAtStart creates a cumulative function which has the value:
    *
    * * `0` before `interval.start()`,
    * * `height` after `interval.start()`.
    *
    * If the `interval` or the `height` is _absent_, the created cumulative function is `0` everywhere.
    *
    * :::info
    * Combining _pulses_ ({@link Model.pulse}) and _steps_ ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}) is not supported yet.
    * :::
    *
    * @example
    *
    * Let us consider a set of tasks. Each task either costs a certain amount of money or makes some money. Money is consumed at the start of a task and produced at the end. We have an initial amount of money `initialMoney`, and we want to schedule the tasks so that we do not run out of money (i.e., the amount is always non-negative).
    *
    * Tasks cannot overlap. Our goal is to find the shortest schedule possible.
    *
    * ```ts
    * // The input data:
    * const initialMoney = 100;
    * const tasks = [
    *   { length: 10, money: -150 },
    *   { length: 20, money:   40 },
    *   { length: 15, money:   20 },
    *   { length: 30, money:  -10 },
    *   { length: 20, money:   30 },
    *   { length: 25, money:  -20 },
    *   { length: 10, money:   10 },
    *   { length: 20, money:   50 },
    * ];
    *
    * let model = new CP.Model;
    * let taskVars: CP.IntervalVar[] = [];
    * // A set of steps, one for each task:
    * let steps: CP.CumulExpr[] = [];
    *
    * for (let i = 0; i < tasks.length; i++) {
    *   let interval = model.intervalVar({ name: "T" + (i+1), length: tasks[i].length} );
    *   taskVars.push(interval);
    *   if (tasks[i].money < 0) {
    *     // Task costs some money:
    *     steps.push(model.stepAtStart(interval, tasks[i].money));
    *   } else {
    *     // Tasks makes some money:
    *     steps.push(model.stepAtEnd(interval, tasks[i].money));
    *   }
    * }
    *
    * // The initial money increases the cumul at time 0:
    * steps.push(model.stepAt(0, initialMoney));
    * // The money must be non-negative at any time:
    * model.cumulGe(model.cumulSum(steps), 0);
    * // Only one task at a time:
    * model.noOverlap(taskVars);
    *
    * // Minimize the maximum of the ends (makespan):
    * model.max(taskVars.map(t => t.end())).minimize();
    *
    * let result = await CP.solve(model, { searchType: "FDS"});
    * ```@see {@link IntervalVar.stepAtStart | IntervalVar.stepAtStart} is equivalent function on {@link IntervalVar}.
    * @see {@link Model.stepAtEnd}, {@link Model.stepAt}, {@link Model.pulse} for other basic cumulative functions.
    * @see {@link Model.cumulLe} and {@link Model.cumulGe} for constraints on cumulative functions.
    *  */
    stepAtStart(interval, height) {
        let outParams = [GetIntervalVar(interval), GetIntExpr(height)];
        const result = new CumulExpr(this, "stepAtStart", outParams);
        return result;
    }
    /**
    *
    * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
    *
    * @remarks
    *
    * Cumulative _step_ functions could be used to model a resource that is consumed or produced and, therefore, changes in amount over time. Examples of such a resource are a battery, an account balance, a product's stock, etc.
    *
    * A `stepAtEnd` can change the amount of such resource at the end of a given variable. The amount is changed by the given `height`, which can be positive or negative.
    *
    * The `height` can be a constant value or an expression. In particular, the `height` can be given by an {@link IntVar}. In such a case, the `height` is unknown at the time of the model creation but is determined during the search.
    *
    * Note that the `interval` and the `height` may have different presence statuses (when the `height` is given by a variable or an expression). In this case, the step is present only if both the `interval` and the `height` are present. Therefore, it is helpful to constrain the `height` to have the same presence status as the `interval`.
    *
    * Cumulative steps could be combined using {@link Model.cumulPlus},{@link Model.cumulMinus}, {@link Model.cumulNeg} and {@link Model.cumulSum}. A cumulative function's minimum and maximum height can be constrained using {@link Model.cumulLe} and {@link Model.cumulGe}.
    *
    * #### Formal definition
    *
    * stepAtEnd creates a cumulative function which has the value:
    *
    * * `0` before `interval.end()`,
    * * `height` after `interval.end()`.
    *
    * If the `interval` or the `height` is _absent_, the created cumulative function is `0` everywhere.
    *
    * :::info
    * Combining _pulses_ ({@link Model.pulse}) and _steps_ ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}) is not supported yet.
    * :::
    *
    * @example
    *
    * Let us consider a set of tasks. Each task either costs a certain amount of money or makes some money. Money is consumed at the start of a task and produced at the end. We have an initial amount of money `initialMoney`, and we want to schedule the tasks so that we do not run out of money (i.e., the amount is always non-negative).
    *
    * Tasks cannot overlap. Our goal is to find the shortest schedule possible.
    *
    * ```ts
    * // The input data:
    * const initialMoney = 100;
    * const tasks = [
    *   { length: 10, money: -150 },
    *   { length: 20, money:   40 },
    *   { length: 15, money:   20 },
    *   { length: 30, money:  -10 },
    *   { length: 20, money:   30 },
    *   { length: 25, money:  -20 },
    *   { length: 10, money:   10 },
    *   { length: 20, money:   50 },
    * ];
    *
    * let model = new CP.Model;
    * let taskVars: CP.IntervalVar[] = [];
    * // A set of steps, one for each task:
    * let steps: CP.CumulExpr[] = [];
    *
    * for (let i = 0; i < tasks.length; i++) {
    *   let interval = model.intervalVar({ name: "T" + (i+1), length: tasks[i].length} );
    *   taskVars.push(interval);
    *   if (tasks[i].money < 0) {
    *     // Task costs some money:
    *     steps.push(model.stepAtStart(interval, tasks[i].money));
    *   } else {
    *     // Tasks makes some money:
    *     steps.push(model.stepAtEnd(interval, tasks[i].money));
    *   }
    * }
    *
    * // The initial money increases the cumul at time 0:
    * steps.push(model.stepAt(0, initialMoney));
    * // The money must be non-negative at any time:
    * model.cumulGe(model.cumulSum(steps), 0);
    * // Only one task at a time:
    * model.noOverlap(taskVars);
    *
    * // Minimize the maximum of the ends (makespan):
    * model.max(taskVars.map(t => t.end())).minimize();
    *
    * let result = await CP.solve(model, { searchType: "FDS"});
    * ```@see {@link IntervalVar.stepAtEnd | IntervalVar.stepAtEnd} is equivalent function on {@link IntervalVar}.
    * @see {@link Model.stepAtStart}, {@link Model.stepAt}, {@link Model.pulse} for other basic cumulative functions.
    * @see {@link Model.cumulLe} and {@link Model.cumulGe} for constraints on cumulative functions.
    *  */
    stepAtEnd(interval, height) {
        let outParams = [GetIntervalVar(interval), GetIntExpr(height)];
        const result = new CumulExpr(this, "stepAtEnd", outParams);
        return result;
    }
    /**
    * Creates cumulative function (expression) that changes value at `x` by the given `height`. The height can be positive or negative, and it can be given by a constant or an expression (for example, by {@link Model.intVar}).
    *
    * @remarks
    *
    * Function stepAt is functionally the same as {@link Model.stepAtStart} and {@link Model.stepAtEnd}. However, the time of the change is given by the constant value `x` instead of by the start/end of an interval variable.
    *
    * #### Formal definition
    *
    * `stepAt` creates a cumulative function which has the value:
    *
    * * 0 before `x`,
    * * `height` after `x`.
    *
    * @see {@link Model.stepAtStart}, {@link Model.stepAtEnd} for an example with `stepAt`.
    * @see {@link Model.cumulLe} and {@link Model.cumulGe} for constraints on cumulative functions.
    *  */
    stepAt(x, height) {
        let outParams = [GetInt(x), GetIntExpr(height)];
        const result = new CumulExpr(this, "stepAt", outParams);
        return result;
    }
    /**
    * Addition of two cumulative expressions.
    *
    * @remarks
    *
    * Computes addition of two cumulative functions.
    *
    * #### Formal definition
    *
    * Let `result = cumulPlus(lhs, rhs)`. Then for any number `x` in range {@link IntervalMin}..{@link IntervalMax} the value of `result` at `x` is equal to `lhs` at `x` plus `rhs` at `x`.
    *
    * `cumulPlus(lhs, rhs)` is the same as `cumulSum([lhs, rhs])`.
    *
    * @see {@link CumulExpr.cumulPlus | CumulExpr.cumulPlus} for the equivalent function on {@link CumulExpr}.
    * @see {@link cumulSum}, {@link cumulMinus}, {@link cumulNeg} for other ways to combine cumulative functions.
    *  */
    cumulPlus(lhs, rhs) {
        let outParams = [GetCumulExpr(lhs), GetCumulExpr(rhs)];
        const result = new CumulExpr(this, "cumulPlus", outParams);
        return result;
    }
    /**
    * Subtraction of two cumulative expressions.
    *
    * @remarks
    *
    * Computes subtraction of two cumulative functions.
    *
    * #### Formal definition
    *
    * Let `result = cumulMinus(lhs, rhs)`. Then for any number `x` in range {@link IntervalMin}..{@link IntervalMax} the value of `result` at `x` is equal to `lhs` at `x` minus `rhs` at `x`.
    *
    * `cumulMinus(lhs, rhs)` is the same as `cumulSum([lhs, cumulNeg(rhs)])`.
    *
    * @see {@link CumulExpr.cumulMinus | CumulExpr.cumulMinus} for the equivalent function on {@link CumulExpr}.
    * @see {@link cumulSum}, {@link cumulPlus}, {@link cumulNeg} for other ways to combine cumulative functions.
    *  */
    cumulMinus(lhs, rhs) {
        let outParams = [GetCumulExpr(lhs), GetCumulExpr(rhs)];
        const result = new CumulExpr(this, "cumulMinus", outParams);
        return result;
    }
    /**
    * Negation of a cumulative expression.
    *
    * @remarks
    *
    * Computes negation of a cumulative function. That is, the resulting function has the opposite values.
    *
    * @see {@link CumulExpr.cumulNeg | CumulExpr.cumulNeg} for the equivalent function on {@link CumulExpr}.
    * @see {@link cumulSum}, {@link cumulPlus}, {@link cumulMinus} for other ways to combine cumulative functions.
    *  */
    cumulNeg(arg) {
        let outParams = [GetCumulExpr(arg)];
        const result = new CumulExpr(this, "cumulNeg", outParams);
        return result;
    }
    /**
    * Sum of cumulative expressions.
    *
    * @remarks
    *
    * Computes the sum of cumulative functions. The sum can be used, e.g., to combine contributions of individual tasks to total resource consumption.
    *
    * @see {@link cumulPlus}, {@link cumulMinus}, {@link cumulNeg} for other ways to combine cumulative functions.
    *  */
    cumulSum(array) {
        let outParams = [this._getCumulExprArray(array)];
        const result = new CumulExpr(this, "cumulSum", outParams);
        return result;
    }
    /**
    * Constrains cumulative function `cumul` to be everywhere less or equal to `maxCapacity`.
    *
    * @remarks
    *
    * This function can be used to specify the maximum limit of resource usage at any time. For example, to limit the number of workers working simultaneously, limit the maximum amount of material on stock, etc.
    * See {@link Model.pulse} for an example with `cumulLe`.
    *
    * @see {@link CumulExpr.cumulLe | CumulExpr.cumulLe} for the equivalent function on {@link CumulExpr}.
    * @see {@link Model.cumulGe} for the opposite constraint.
    *  */
    cumulLe(cumul, maxCapacity) {
        let outParams = [GetCumulExpr(cumul), GetInt(maxCapacity)];
        const result = new Constraint(this, "cumulLe", outParams);
    }
    /**
    * Constrains cumulative function `cumul` to be everywhere greater or equal to `minCapacity`.
    *
    * @remarks
    *
    * This function can be used to specify the minimum limit of resource usage at any time. For example to make sure that there is never less than zero material on stock.
    * See {@link Model.stepAtStart} for an example with `cumulGe`.
    *
    * @see {@link CumulExpr.cumulGe | CumulExpr.cumulGe} for the equivalent function on {@link CumulExpr}.
    * @see {@link Model.cumulLe} for the opposite constraint.
    *  */
    cumulGe(cumul, minCapacity) {
        let outParams = [GetCumulExpr(cumul), GetInt(minCapacity)];
        const result = new Constraint(this, "cumulGe", outParams);
    }
    /** @internal */
    _cumulMaxProfile(cumul, profile) {
        let outParams = [GetCumulExpr(cumul), GetIntStepFunction(profile)];
        const result = new Constraint(this, "cumulMaxProfile", outParams);
    }
    /** @internal */
    _cumulMinProfile(cumul, profile) {
        let outParams = [GetCumulExpr(cumul), GetIntStepFunction(profile)];
        const result = new Constraint(this, "cumulMinProfile", outParams);
    }
    /** @internal */
    _cumulStairs(atoms) {
        let outParams = [this._getCumulExprArray(atoms)];
        const result = new CumulExpr(this, "cumulStairs", outParams);
        return result;
    }
    /** @internal */
    _precedenceEnergyBefore(main, others, heights, capacity) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(others), this._getIntArray(heights), GetInt(capacity)];
        const result = new Constraint(this, "precedenceEnergyBefore", outParams);
        this.constraint(result);
    }
    /** @internal */
    _precedenceEnergyAfter(main, others, heights, capacity) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(others), this._getIntArray(heights), GetInt(capacity)];
        const result = new Constraint(this, "precedenceEnergyAfter", outParams);
        this.constraint(result);
    }
    /**
    * Computes sum of values of the step function `func` over the interval `interval`.
    *
    * @remarks
    *
    * The sum is computed over all points in range `interval.start()` .. `interval.end()-1`. The sum includes the function value at the start time but not the value at the end time. If the interval variable has zero length, then the result is 0. If the interval variable is absent, then the result is `absent`.
    *
    * **Requirement**: The step function `func` must be non-negative.
    *
    * @see {@link IntStepFunction.stepFunctionSum} for the equivalent function on {@link IntStepFunction}.
    *  */
    stepFunctionSum(func, interval) {
        let outParams = [GetIntStepFunction(func), GetIntervalVar(interval)];
        const result = new IntExpr(this, "intStepFunctionSum", outParams);
        return result;
    }
    /** @internal */
    _stepFunctionSumInRange(func, interval, lb, ub) {
        let outParams = [GetIntStepFunction(func), GetIntervalVar(interval), GetInt(lb), GetInt(ub)];
        const result = new Constraint(this, "intStepFunctionSumInRange", outParams);
    }
    /**
    * Evaluates a step function at a given point.
    *
    * @remarks
    *
    * The result is the value of the step function `func` at the point `arg`. If the value of `arg` is `absent`, then the result is also `absent`.
    *
    * By constraining the returned value, it is possible to limit `arg` to be only within certain segments of the segmented function. In particular, functions {@link Model.forbidStart} and {@link Model.forbidEnd} work that way.
    *
    * @see {@link IntStepFunction.stepFunctionEval} for the equivalent function on {@link IntStepFunction}.
    * @see {@link Model.forbidStart}, {@link Model.forbidEnd} are convenience functions built on top of `stepFunctionEval`.
    *  */
    stepFunctionEval(func, arg) {
        let outParams = [GetIntStepFunction(func), GetIntExpr(arg)];
        const result = new IntExpr(this, "intStepFunctionEval", outParams);
        return result;
    }
    /** @internal */
    _stepFunctionEvalInRange(func, arg, lb, ub) {
        let outParams = [GetIntStepFunction(func), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        const result = new Constraint(this, "intStepFunctionEvalInRange", outParams);
    }
    /** @internal */
    _stepFunctionEvalNotInRange(func, arg, lb, ub) {
        let outParams = [GetIntStepFunction(func), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        const result = new Constraint(this, "intStepFunctionEvalNotInRange", outParams);
    }
    /**
    * Forbid the interval variable to overlap with segments of the function where the value is zero.
    *
    * @remarks
    *
    * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero. That is, if $[s, e)$ is a segment of the step function where the value is zero, then the interval variable either ends before $s$ ($\mathtt{interval.end()} \le s$) or starts after $e$ ($e \le \mathtt{interval.start()}$).
    *
    * @see {@link IntervalVar.forbidExtent} for the equivalent function on {@link IntervalVar}.
    * @see {@link Model.forbidStart}, {@link Model.forbidEnd} for similar functions that constrain the start/end of an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidExtent(interval, func) {
        let outParams = [GetIntervalVar(interval), GetIntStepFunction(func)];
        const result = new Constraint(this, "forbidExtent", outParams);
    }
    /**
    * Constrains the start of the interval variable to be outside of the zero-height segments of the step function.
    *
    * @remarks
    *
    * This function is equivalent to:
    *
    * ```
    *   model.constraint(model.ne(model.stepFunctionEval(func, interval.start()), 0));
    * ```
    *
    * I.e., the function value at the start of the interval variable cannot be zero.
    *
    * @see {@link IntervalVar.forbidStart} for the equivalent function on {@link IntervalVar}.
    * @see {@link Model.forbidEnd} for similar function that constrains end an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidStart(interval, func) {
        let outParams = [GetIntervalVar(interval), GetIntStepFunction(func)];
        const result = new Constraint(this, "forbidStart", outParams);
    }
    /**
    * Constrains the end of the interval variable to be outside of the zero-height segments of the step function.
    *
    * @remarks
    *
    * This function is equivalent to:
    *
    * ```
    *   model.constraint(model.ne(model.stepFunctionEval(func, interval.end()), 0));
    * ```
    *
    * I.e., the function value at the end of the interval variable cannot be zero.
    *
    * @see {@link IntervalVar.forbidEnd} for the equivalent function on {@link IntervalVar}.
    * @see {@link Model.forbidStart} for similar function that constrains start an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidEnd(interval, func) {
        let outParams = [GetIntervalVar(interval), GetIntStepFunction(func)];
        const result = new Constraint(this, "forbidEnd", outParams);
    }
    /** @internal */
    _disjunctiveIsBefore(x, y) {
        let outParams = [GetIntervalVar(x), GetIntervalVar(y)];
        const result = new BoolExpr(this, "disjunctiveIsBefore", outParams);
        return result;
    }
    /** @internal */
    _itvPresenceChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        const result = new Constraint(this, "itvPresenceChain", outParams);
    }
    /** @internal */
    _itvPresenceChainWithCount(intervals, count) {
        let outParams = [this._getIntervalVarArray(intervals), GetIntExpr(count)];
        const result = new Constraint(this, "itvPresenceChainWithCount", outParams);
    }
    /** @internal */
    _endBeforeStartChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        const result = new Constraint(this, "endBeforeStartChain", outParams);
    }
    /** @internal */
    _startBeforeStartChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        const result = new Constraint(this, "startBeforeStartChain", outParams);
    }
    /** @internal */
    _endBeforeEndChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        const result = new Constraint(this, "endBeforeEndChain", outParams);
    }
    /** @internal */
    _decisionPresentIntVar(variable, isLeft) {
        let outParams = [GetIntExpr(variable), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentIntVar", outParams);
        return result;
    }
    /** @internal */
    _decisionAbsentIntVar(variable, isLeft) {
        let outParams = [GetIntExpr(variable), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionAbsentIntVar", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentIntervalVar(variable, isLeft) {
        let outParams = [GetIntervalVar(variable), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentIntervalVar", outParams);
        return result;
    }
    /** @internal */
    _decisionAbsentIntervalVar(variable, isLeft) {
        let outParams = [GetIntervalVar(variable), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionAbsentIntervalVar", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentLE(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentLE", outParams);
        return result;
    }
    /** @internal */
    _decisionOptionalGT(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionOptionalGT", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentGE(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentGE", outParams);
        return result;
    }
    /** @internal */
    _decisionOptionalLT(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionOptionalLT", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentStartLE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentStartLE", outParams);
        return result;
    }
    /** @internal */
    _decisionOptionalStartGT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionOptionalStartGT", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentStartGE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentStartGE", outParams);
        return result;
    }
    /** @internal */
    _decisionOptionalStartLT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionOptionalStartLT", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentEndLE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentEndLE", outParams);
        return result;
    }
    /** @internal */
    _decisionOptionalEndGT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionOptionalEndGT", outParams);
        return result;
    }
    /** @internal */
    _decisionPresentEndGE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionPresentEndGE", outParams);
        return result;
    }
    /** @internal */
    _decisionOptionalEndLT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        const result = new SearchDecision(this, "decisionOptionalEndLT", outParams);
        return result;
    }
    /** @internal */
    _noGood(decisions) {
        let outParams = [this._getSearchDecisionArray(decisions)];
        const result = new Constraint(this, "noGood", outParams);
    }
    /** @internal */
    _related(x, y) {
        let outParams = [GetIntervalVar(x), GetIntervalVar(y)];
        const result = new Blank(this, "related", outParams);
    }
    /** @internal */
    pack(load, where, sizes) {
        let outParams = [this._getIntExprArray(load), this._getIntExprArray(where), this._getIntArray(sizes)];
        const result = new Constraint(this, "pack", outParams);
    }
    noOverlap(seq, transitions) {
        if (Array.isArray(seq))
            seq = this.auxiliarySequenceVar(seq);
        this._noOverlap(seq, transitions);
    }
    /**
     * Assign a name to the model. It overwrites any name that was previously
     * set, e.g. in the {@link Model} constructor.
     *
     * Naming the model is optional.  The primary purpose of the name is to
     * distinguish between different models during benchmarking (see {@link benchmark}).
     */
    setName(name) {
        this.#name = name;
    }
    /**
     * Returns the name of the model. When no name was set, it returns `undefined`.
     */
    getName() { return this.#name; }
    constraint(constraint) {
        this.#model.push(GetConstraint(constraint));
    }
    /** @internal */
    _addBlank(blank) {
        this.#model.push(blank._getArg());
    }
    /** @internal */
    boolConst(value) {
        return new BoolExpr(this, "boolConst", [GetBool(value)]);
    }
    /** @internal */
    trueConst() {
        return new BoolExpr(this, "boolConst", [true]);
    }
    /** @internal */
    falseConst() {
        return new BoolExpr(this, "boolConst", [false]);
    }
    /** @internal */
    absentConst() {
        return new BoolExpr(this, "boolConst", []);
    }
    /** @internal */
    intConst(value) {
        return new IntExpr(this, "intConst", [GetInt(value)]);
    }
    /** @internal */
    floatConst(value) {
        return new FloatExpr(this, "floatConst", [GetFloat(value)]);
    }
    /** @internal */
    boolVar(params = {}) {
        const x = new BoolVar(this);
        if (params.name)
            x.setName(params.name);
        if (params.optional)
            x.makeOptional();
        if (typeof params.range === "boolean")
            x.setRange(+params.range, +params.range);
        else if (Array.isArray(params.range)) {
            if (params.range[0] !== undefined)
                x.setMin(params.range[0]);
            if (params.range[1] !== undefined)
                x.setMax(params.range[1]);
        }
        this.#model.push(x._getArg());
        this.#boolVars.push(x);
        return x;
    }
    auxiliaryBoolVar(arg) {
        let x = this.boolVar(arg);
        x._makeAuxiliary();
        return x;
    }
    /**
     * Creates a new integer variable and adds it to the model.
     *
     * An integer variable represents an unknown value the solver must find.
     * The variable can be optional.
     * In this case, its value in a solution could be _absent_, meaning that the solution does not use the variable at all.
     *
     * @param params.range - Constraints the variable's value to be in the given range.
     * @param params.optional - Whether the variable is optional (can take value _absent_). The default is `false`.
     * @param params.name - The name of the variable. The default is `undefined`.
     * @returns The created integer variable.
     *
     * @remarks
     * The parameter `params.range` can be either a number or a tuple of two numbers.
     * If a number is given, it represents a fixed value.
     * If a tuple is given, it represents a range of possible values.
     * The default range is `0` to `IntVarMax`.
     * If a range is specified but one of the values is undefined (e.g., `range: [, 100]`), then the default value is used instead (in our case, `0`).
     *
     * @example
     *
     * ```ts
     * let model = new CP.Model();
     *
     * // Create a present integer variable with with possible values 1..10:
     * let x = model.intVar({ range: [1, 10], name: "x" });
     *
     * // Create an optional integer variable with possible values 5..IntVarMax:
     * let y = model.intVar({ range: [5, ], optional: true, name: "y" });
     *
     * // Create an integer variable with a fixed value 10, but optional:
     * let z = model.intVar({ range: 10, optional: true, name: "z" });
     * ```
     */
    intVar(params = {}) {
        const x = new IntVar(this);
        if (params.name)
            x.setName(params.name);
        if (params.optional)
            x.makeOptional();
        if (typeof params.range === "number")
            x.setRange(params.range, params.range);
        else if (Array.isArray(params.range)) {
            if (params.range[0] !== undefined)
                x.setMin(params.range[0]);
            if (params.range[1] !== undefined)
                x.setMax(params.range[1]);
        }
        this.#model.push(x._getArg());
        this.#intVars.push(x);
        return x;
    }
    /** @internal */
    auxiliaryIntVar(params) {
        let x = this.intVar(params);
        x._makeAuxiliary();
        return x;
    }
    /** @internal */
    floatVar(params = {}) {
        const x = new FloatVar(this);
        if (params.name)
            x.setName(params.name);
        if (params.optional)
            x.makeOptional();
        if (typeof params.range === "number")
            x.setRange(params.range, params.range);
        else if (Array.isArray(params.range)) {
            if (params.range[0] !== undefined)
                x.setMin(params.range[0]);
            if (params.range[1] !== undefined)
                x.setMax(params.range[1]);
        }
        this.#model.push(x._getArg());
        this.#floatVars.push(x);
        return x;
    }
    auxiliaryFloatVar(arg) {
        let x = this.floatVar(arg);
        x._makeAuxiliary();
        return x;
    }
    /**
     * Creates a new interval variable and adds it to the model.
     *
     * An interval variable represents an unknown interval (a task, operation,
     * action) that the solver assigns a value in such a way as to satisfy all
     * constraints.  An interval variable has a start, end, and length. In a
     * solution, _start ≤ end_ and  _length = end - start_.
     *
     * The interval variable can be optional. In this case, its value in a solution
     * could be _absent_, meaning that the task/operation is not performed.
     *
     * @param params.start - Constraints the start of the interval.
     * @param params.end - Constraints the end of the interval.
     * @param params.length - Constraints the length of the interval.
     * @param params.optional - Whether the interval variable is optional (can take value _absent_). The default is `false`.
     * @param params.name - The name of the interval variable. The default is `undefined`.
     * @returns The created interval variable.
     *
     * @remarks
     * Parameters `params.start`, `params.end`, and `params.length` can be either a
     * number or a tuple of two numbers.  If a number is given, it represents a
     * fixed value. If a tuple is given, it represents a range of possible values.
     * The default range for start, end and length is `0` to `IntervalMax`.
     * If a range is specified but one of the values is undefined (e.g. `start: [, 100]`)
     * then the default value is used instead (in our case `0`).
     *
     * @example
     *
     * ```ts
     * let model = new CP.Model();
     *
     * // Create a present interval variable with a fixed start but unknown length:
     * let x = model.intervalVar({ start: 0, length: [10, 20], name: "x" });
     *
     * // Create an interval variable with a start and end ranges:
     * let y = model.intervalVar({ start: [0, 5], end: [10, 15], name: "y" });
     *
     * // Create an optional interval variable with a length interval 5..10:
     * let z = model.intervalVar({ length: [5, 10], optional: true, name: "z" });
     * ```
     *
     * @see {@link IntervalVar}
     */
    intervalVar(params = {}) {
        const itv = new IntervalVar(this);
        if (typeof params.start === "number")
            itv.setStart(params.start);
        else if (Array.isArray(params.start)) {
            if (params.start[0] !== undefined)
                itv.setStartMin(params.start[0]);
            if (params.start[1] !== undefined)
                itv.setStartMax(params.start[1]);
        }
        if (typeof params.end === "number")
            itv.setEnd(params.end);
        else if (Array.isArray(params.end)) {
            if (params.end[0] !== undefined)
                itv.setEndMin(params.end[0]);
            if (params.end[1] !== undefined)
                itv.setEndMax(params.end[1]);
        }
        if (typeof params.length === "number")
            itv.setLength(params.length);
        else if (Array.isArray(params.length)) {
            if (params.length[0] !== undefined)
                itv.setLengthMin(params.length[0]);
            if (params.length[1] !== undefined)
                itv.setLengthMax(params.length[1]);
        }
        if (params.optional === true)
            itv.makeOptional();
        if (params.name !== undefined)
            itv.setName(params.name);
        this.#model.push(itv._getArg());
        this.#intervalVars.push(itv);
        return itv;
    }
    auxiliaryIntervalVar(param) {
        let x = this.intervalVar(param);
        x._makeAuxiliary();
        return x;
    }
    /**
    * Creates a sequence variable from the provided set of interval variables.
    *
    * @param intervals Interval variables that will form the sequence in the solution.
    * @param types Types of the intervals, used in particular for transition times.
    *
    * @remarks
    *
    * Sequence variable is used together with {@link SequenceVar.noOverlap}
    * constraint to model a set of intervals that cannot overlap and so they form
    * a sequence in the solution. Sequence variable allows us to constrain the sequence further.
    * For example, by specifying sequence-dependent minimum
    * transition times.
    *
    * Types can be used to mark intervals with similar properties. In
    * particular, they behave similarly in terms of transition times.
    * Interval variable `intervals[0]` will have type `type[0]`, `intervals[1]`
    * will have type `type[1]` and so on.
    *
    * If `types` are not specified then `intervals[0]` will have type 0,
    * `intervals[1]` will have type 1, and so on.
    *
    * :::info Types
    * The length of the array `types` must be the same as the length of the array
    * `intervals`.
    *
    * Types should be integer numbers in the range `0` to `n-1` where `n` is the
    * number of types.
    * :::
    *
    * @see {@link SequenceVar.noOverlap | SequenceVar.noOverlap} for an example of sequenceVar usage with transition times.
    * @see {@link SequenceVar}
    * @see {@link Model.noOverlap | Model.noOverlap}
    *  */
    sequenceVar(intervals, types) {
        let outParams = [this._getIntervalVarArray(intervals)];
        if (types !== undefined)
            outParams.push(this._getIntArray(types));
        const result = new SequenceVar(this, "sequenceVar", outParams);
        this.#model.push(result._getArg());
        return result;
    }
    /** @internal */
    auxiliarySequenceVar(intervals, types) {
        let x = this.sequenceVar(intervals, types);
        x._makeAuxiliary();
        return x;
    }
    /**
     * Creates a boolean expression that is true if the given argument is present in the solution.
     *
     * @param arg - The argument to check for presence in the solution.
     * @returns A boolean expression that is true if the argument is present in the solution.
     *
     * @remarks
     * The value of the expression remains unknown until a solution is found.
     * The expression can be used in a constraint to restrict possible solutions.
     *
     * The function is equivalent to {@link IntervalVar.presence | IntervalVar.presence}
     * and {@link IntExpr.presence | IntExpr.presence}.
     *
     * @example
     *
     * In the following example, interval variables `x` and `y` must have the same presence status.
     * I.e. they must either be both _present_ or both _absent_.
     *
     * ```ts
     * const model = new CP.Model();
     *
     * let x = model.intervalVar({ name: "x", optional: true, length: 10, start: [0, 100] });
     * let y = model.intervalVar({ name: "y", optional: true, length: 10, start: [0, 100] });
     * model.constraint(model.presenceOf(x).eq(model.presenceOf(y)));
     * ```
     *
     * #### Simple constraints over presence
     *
     * The solver treats binary constraints over presence in a special way: it
     * uses them to better propagate other constraints over the same pairs of variables.
     * Let's extend the previous example by a constraint that `x` must end before
     * `y` starts:
     *
     * ```ts
     * let x = model.intervalVar({ name: "x", optional: true, length: 10, start: [0, 100] });
     * let y = model.intervalVar({ name: "y", optional: true, length: 10, start: [0, 100] });
     * model.constraint(model.presenceOf(x).eq(model.presenceOf(y)));
     * // x.end <= y.start:
     * let isBefore = x.end().le(y.start());
     * model.constraint(isBefore);
     * ```
     *
     * In this example, the solver sees (propagates) that the minimum start time of
     * `y` is 10 and maximum end time of `x` is 90.  Without the constraint over
     * `presenceOf`, the solver could not propagate that because one
     * of the intervals can be _absent_ and the other one _present_ (and so the
     * value of `isBefore` would be _absent_ and the constraint would be
     * satisfied).
     *
     * To achieve good propagation, it is recommended to use binary
     * constraints over `presenceOf` when possible. For example, multiple binary
     * constraints can be used instead of a single complicated constraint.
     */
    presenceOf(arg) {
        if (IsIntExpr(arg))
            return new BoolExpr(this, "intPresenceOf", [GetSafeArg(arg)]);
        return new BoolExpr(this, "intervalPresenceOf", [GetIntervalVar(arg)]);
    }
    /**
     * Minimize the provided expression. I.e., search for a solution that achieves the minimal
     * value of the expression.
     *
     * @param expr The expression to minimize.
     *
     * @remarks
     * Equivalent of function {@link IntExpr.minimize | IntExpr.minimize}.
     *
     * @example
     *
     * In the following model, we search for a solution that minimizes the maximum
     * end of the two intervals `x` and `y`:
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ length: 10, name: "x" });
     * let y = model.intervalVar({ length: 20, name: "y" });
     * model.minimize(model.max2(x.end(), y.end()));
     * let result = await CP.solve(model);
     * ```
     * @see {@link maximize}
     */
    minimize(expr) {
        this.#objective = new Objective(this, "minimize", [GetIntExpr(expr)])._getProps();
        this.#primaryObjectiveExpr = expr;
    }
    /**
     * Maximize the provided expression. I.e., search for a solution that achieves the maximal
     * value of the expression.
     *
     * @param expr The expression to maximize.
     *
     * @remarks
     * Equivalent of function {@link IntExpr.maximize | IntExpr.maximize}.
     *
     * @example
     *
     * In the following model, we search for a solution that maximizes
     * the length of the interval variable `x`:
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ length: [10, 20], name: "x" });
     * model.maximize(x.length());
     * let result = await CP.solve(model);
     * ```
     *
     * @see {@link minimize}
     */
    maximize(expr) {
        this.#objective = new Objective(this, "maximize", [GetIntExpr(expr)])._getProps();
        this.#primaryObjectiveExpr = expr;
    }
    /** @internal */
    _minimizeConsecutively(arg) {
        this.#objective = new Objective(this, "minimizeConsecutively", [this._getIntExprArray(arg)])._getProps();
        this.#primaryObjectiveExpr = arg[0];
    }
    /** @internal */
    _maximizeConsecutively(arg) {
        this.#objective = new Objective(this, "maximizeConsecutively", [this._getIntExprArray(arg)])._getProps();
        this.#primaryObjectiveExpr = arg[0];
    }
    /**
     * Creates a new {@link IntStepFunction}.
     *
     * @param values An array of points defining the step function in the form
     *               $[[x_0, y_0], [x_1, y_1], \dots, [x_n, y_n]]$, where $x_i$ and $y_i$ are integers.
     *               The array must be sorted by $x_i$.
     *
     * @remarks
     *
     * Integer step function is a piecewise constant function defined on integer
     * values in range {@link IntVarMin} to {@link IntVarMax}.  The function is
     * defined as follows:
     *
     *  * $f(x) = 0$ for $x < x_0$,
     *  * $f(x) = y_i$ for $x_i \leq x < x_{i+1}$
     *  * $f(x) = y_n$ for $x \geq x_n$.
     *
     * Step functions can be used in the following ways:
     *
     *   * Function {@link Model.stepFunctionEval} evaluates the function at the given point (given as {@link IntExpr}).
     *   * Function {@link Model.stepFunctionSum} computes a sum (integral) of the function over an {@link IntervalVar}.
     *   * Constraints {@link Model.forbidStart} and {@link Model.forbidEnd} forbid the start/end of an {@link IntervalVar} to be in a zero-value interval of the function.
     *   * Constraint {@link Model.forbidExtent} forbids the extent of an {@link IntervalVar} to be in a zero-value interval of the function.
     */
    stepFunction(values) {
        return new IntStepFunction(this, values);
    }
    /** @internal */
    getPrimaryObjectiveExpression() {
        return this.#primaryObjectiveExpr;
    }
    /** @internal */
    _toObject(params, warmStart) {
        return {
            'refs': this.#refs,
            'model': this.#model,
            'name': this.#name,
            'objective': this.#objective,
            'parameters': paramsForJSON(params),
            'warmStart': warmStart ? warmStart._serialize() : undefined
        };
    }
    /** @internal */
    _serialize(command, params, warmStart) {
        let data = this._toObject(params, warmStart);
        data.msg = command;
        let jsonModel = JSON.stringify(data);
        // TODO:1 Is the name OPTALCP_MODEL good? It is not only Model, it is Model + Parameters + WarmStart..
        let modelFile = process.env.OPTALCP_MODEL;
        if (modelFile !== undefined) {
            // Env. variable specifies that we should dump the model into a file. E.g.
            // for debugging. Write it asynchronously:
            fs.writeFile(modelFile, jsonModel, err => {
                if (err)
                    console.error("Cannot write model file '" + modelFile + "': " + err);
                else
                    console.log("Model file '" + modelFile + "' written successfully.");
            });
        }
        return jsonModel;
    }
    /** @internal */
    _fromObject(data) {
        // Assumes that the model is empty.
        assert(data.model !== undefined);
        assert(data.refs !== undefined);
        this.#refs = data.refs;
        this.#model = data.model;
        this.#name = data.name;
        this.#objective = data.objective;
        if (this.#objective) {
            // Decode primary objective expression from the objective
            let primaryObjectiveArg = undefined;
            if (this.#objective.func == "minimize" || this.#objective.func == "maximize")
                primaryObjectiveArg = this.#objective.args[0];
            else {
                assert(this.#objective.func == "minimizeConsecutively" || this.#objective.func == "maximizeConsecutively");
                let args = this.#objective.args[0];
                primaryObjectiveArg = args[0];
            }
            // Now we have primary objective expression as Argument. We need to create
            // IntExpr | number from it. And we use reusableIntExpr for that purpose.
            // Theoretically the primary objective can be a constant, so we have to take care about that.
            if (typeof primaryObjectiveArg === "number")
                this.#primaryObjectiveExpr = this.intConst(primaryObjectiveArg);
            else if (typeof primaryObjectiveArg === "boolean")
                this.#primaryObjectiveExpr = this.boolConst(primaryObjectiveArg);
            else {
                // The expression is going to be used multiple times. Create ref if there isn't any already:
                if (primaryObjectiveArg.ref === undefined) {
                    primaryObjectiveArg.ref = this._getNewRefId(primaryObjectiveArg.arg);
                    primaryObjectiveArg.arg = undefined;
                }
                this.#primaryObjectiveExpr = new IntExpr(this, "reusableIntExpr", [primaryObjectiveArg]);
            }
        }
        // Find variables in the model
        for (let i = 0; i < this.#refs.length; i++) {
            let props = this.#refs[i];
            if (props.func == "boolVar")
                this.#boolVars.push(new BoolVar(this, props, i));
            else if (props.func == "intVar")
                this.#intVars.push(new IntVar(this, props, i));
            else if (props.func == "intervalVar")
                this.#intervalVars.push(new IntervalVar(this, props, i));
        }
    }
    /** @internal */
    _getIntArray(arg) {
        if (TYPE_CHECK_LEVEL >= 1)
            assert(IsIntArray(arg));
        return this.#wrapConstArray(arg);
    }
    /** @internal */
    _getFloatArray(arg) {
        if (TYPE_CHECK_LEVEL >= 2) {
            for (const item of arg)
                assert(typeof item == 'number');
        }
        return this.#wrapConstArray(arg);
    }
    /** @internal */
    _getFloatExprArray(arg) {
        if (TYPE_CHECK_LEVEL >= 2)
            assert(Array.isArray(arg));
        return this.#wrapExprArray(arg, GetFloatExpr);
    }
    /** @internal */
    _getIntExprArray(arg) {
        return this.#wrapExprArray(arg, GetIntExpr);
    }
    /** @internal */
    _getBoolExprArray(arg) {
        return this.#wrapExprArray(arg, GetBoolExpr);
    }
    /** @internal */
    _getIntervalVarArray(arg) {
        VerifyArrayInstanceOf(arg, IntervalVar);
        return this.#wrapPureExprArray(arg);
    }
    /** @internal */
    _getCumulExprArray(arg) {
        VerifyArrayInstanceOf(arg, CumulExpr);
        return this.#wrapPureExprArray(arg);
    }
    /** @internal */
    _getSearchDecisionArray(arg) {
        VerifyArrayInstanceOf(arg, SearchDecision);
        return this.#wrapPureExprArray(arg);
    }
    /** @internal */
    _getSequenceVarArray(arg) {
        VerifyArrayInstanceOf(arg, SequenceVar);
        return this.#wrapPureExprArray(arg);
    }
    /** @internal */
    _getIntMatrix(arg) {
        assert(Array.isArray(arg));
        let n = arg.length;
        for (const row of arg) {
            assert(Array.isArray(row));
            assert(row.length == n);
            for (const item of row)
                assert(Number.isInteger(item));
        }
        let knownNode = this.#knownArrays.get(arg);
        if (knownNode !== undefined)
            return knownNode._getArg();
        let node = new ArrayNode(this, "matrix", [arg]);
        this.#knownArrays.set(arg, node);
        return node._getArg();
    }
    /** @internal */
    _getNewRefId(node) {
        const id = this.#refs.length;
        this.#refs.push(node);
        return id;
    }
    #wrapConstArray(arg) {
        let knownNode = this.#knownArrays.get(arg);
        if (knownNode !== undefined)
            return knownNode._getArg();
        let node = new ArrayNode(this, "array", arg);
        this.#knownArrays.set(arg, node);
        return node._getArg();
    }
    #wrapPureExprArray(arg) {
        // For each user array we saw so far, we have an instance of ArrayNode.
        // This way, if the array is used multiple times, we can reuse it in the same way we reuse standard nodes.
        let knownNode = this.#knownArrays.get(arg);
        if (knownNode !== undefined)
            return knownNode._getArg();
        // Existing node not found, create one:
        let nodeArgs = [];
        for (let i = 0; i < arg.length; i++)
            nodeArgs.push(arg[i]._getArg());
        let node = new ArrayNode(this, "array", nodeArgs);
        this.#knownArrays.set(arg, node);
        return node._getArg();
    }
    #wrapExprArray(arg, argFunc) {
        if (TYPE_CHECK_LEVEL >= 2)
            assert(Array.isArray(arg));
        let knownNode = this.#knownArrays.get(arg);
        if (knownNode !== undefined)
            return knownNode._getArg();
        let nodeArgs = [];
        for (let i = 0; i < arg.length; i++)
            nodeArgs.push(argFunc(arg[i]));
        let node = new ArrayNode(this, "array", nodeArgs);
        this.#knownArrays.set(arg, node);
        return node._getArg();
    }
    /**
     * Returns an array of all interval variables in the model.
     */
    getIntervalVars() {
        // Return a copy of the array to prevent the user from modifying it:
        return [...this.#intervalVars];
    }
    /** @internal */
    getBoolVars() {
        return [...this.#boolVars];
    }
    /** @internal */
    getIntVars() {
        return [...this.#intVars];
    }
}
/**
 * @noInheritDoc
 *
 * The solver provides asynchronous communication with the solver.
 *
 * Unlike function {@link solve}, `Solver` allows the user to process individual events
 * during the solve and to stop the solver at any time.  If you're
 * interested in the final result only, use {@link solve} instead.
 *
 * To solve a model, create a new `Solver` object and call its method {@link Solver.solve}.
 *
 * Solver inherits from `EventEmitter` class from Node.js.  You can subscribe to
 * events using the standard Node.js `on` method.  The following events are
 * emitted:
 *   * `error`: Emits an instance of `Error` (standard Node.js class) when an error occurs.
 *   * `warning`: Emits a `string` for every issued warning.
 *   * `log`: Emits a `string` for every log message.
 *   * `trace`: Emits a `string` for every trace message.
 *   * `solution`: Emits a {@link SolutionEvent} when a solution is found.
 *   * `lowerBound`: Emits a {@link LowerBoundEvent} when a new lower bound is proved.
 *   * `summary`: Emits {@link SolveSummary} at the end of the solve.
 *   * `close`: Emits `void`. It is always the last event emitted.
 *
 * The solver output (log, trace, and warnings) is printed on the console by default,
 * it can be redirected to a file or a stream or suppressed completely using
 * function {@link redirectOutput}.
 *
 * @example
 *
 * In the following example, we run a solver asynchronously. We subscribe to
 * the `solution` event to print the objective value of the solution
 * and the value of interval variable `x`. After finding the first solution, we request
 * the solver to stop.
 * We also subscribe to the `summary` event to print statistics about the solve.
 *
 * ```ts
 * import * as CP from '@scheduleopt/optalcp';
 *
 * ...
 * let model = new CP.Model();
 * let x = model.intervalVar({ ... });
 * ...
 *
 * // Create a new solver:
 * let solver = new CP.Solver;
 *
 * // Subscribe to "solution" events:
 * solver.on("solution", (msg: CP.SolutionEvent) => {
 *   // Get Solution from SolutionEvent:
 *   let solution = msg.solution;
 *   console.log("At time " + msg.solveTime + ", solution found with objective " + solution.getObjective());
 *   // Print value of interval variable x:
 *   if (solution.isAbsent(x))
 *     console.log("  Interval variable x is absent");
 *   else
 *     console.log("  Interval variable x: [" + solution.getStart(x) + " -- " + solution.getEnd(x) + "]");
 *   // Request the solver to stop as soon as possible
 *   // (the message is only informative):
 *   solver.stop("We are happy with the first solution found.");
 * });
 *
 * // Subscribe to "summary" events:
 * solver.on("summary", (msg: CP.SolveSummary) => {
 *   // Print the statistics. The statistics doesn't exist if an error occurred.
 *   console.log("Total duration of solve: " + msg.duration);
 *   console.log("Number of branches: " + msg.nbBranches);
 * });
 *
 * try {
 *   await solver.solve(model, { timeLimit: 60 });
 *   console.log("All done");
 * } catch (e) {
 *   // We did not subscribe to "error" events. So an exception is thrown in
 *   // case of an error.
 *   console.error("Exception caught: ", (e as Error).message);
 * }
 * ```
 *
 * @group Solving
 */
export class Solver extends EventEmitter {
    #solver; // Spawned solver process
    #rlStdout; // stdout of the solver process, wrapped in readline
    #rlClosed = true;
    #solverClosed = false;
    #closeExpected = false;
    #initialized = false;
    #errStreamBuffer = "";
    #hasColors = process.stdout.isTTY;
    #outputStream = process.stdout;
    // Information collected about the solve for SolveResult:
    #summary = undefined;
    #objectiveHistory = [];
    #lowerBoundHistory = [];
    #bestSolution = undefined;
    #bestSolutionTime = undefined;
    #bestLBTime = undefined;
    #bestSolutionValid = undefined;
    // User can pipe the output into `less` command. And the just quit less.
    // In this case we want to stop ASAP.
    #outputStreamErrorCallback = () => {
        this.stop("Error in output stream");
    };
    // For type safety, we declared the events that are emitted by this class
    // above.  Another option is to use an interface, then we would an interface,
    // then we would not have to implement the function below.
    // But then typedoc @noInheritDoc does not work.
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Solves a given model with the given parameters.
     *
     * @param model The model to solve
     * @param params The parameters for the solver
     * @param warmStart An initial solution to start the solver with
     * @param log A stream to redirect the solver output to. If `null`, the output is suppressed.
     *            If `undefined`, the output stream is not changed (the default is standard output).
     * @returns A promise that resolves to a {@link SolveResult} object when the solve is finished.
     *
     * @remarks
     *
     * The solving process starts asynchronously. Use `await` to wait for the
     * solver to finish.  During the solve, the solver emits events that can be
     * intercepted (see {@link on}) to execute a code when the event occurs.
     *
     * Note that JavaScript is single-threaded.  Therefore, it cannot communicate
     * with the solver subprocess while the user code runs.  The user code
     * must be idle (using `await` or waiting for an event) for the solver to
     * function correctly.
     *
     * Note that function {@link solve} cannot be called only once. If you need to
     * solve multiple models or run multiple solves in parallel, then create multiple
     * `Solver` objects.
     *
     * ### Warm start and external solutions
     *
     * If the `warmStart` parameter is specified, the solver will start with the
     * given solution.  The solution must be compatible with the model; otherwise
     * an error is raised.  The solver will take advantage of the
     * solution to speed up the search: it will search only for better solutions
     * (if it is a minimization or maximization problem). The solver may try to
     * improve the provided solution by Large Neighborhood Search.
     *
     * There are two ways to pass a solution to the solver: using `warmStart`
     * parameter and using function {@link sendSolution}.
     * The difference is that `warmStart` is guaranteed to be used by the solver
     * before the solve starts.  On the other hand, `sendSolution` can be called
     * at any time during the solve.
     *
     * Parameter {@link Parameters.LNSUseWarmStartOnly} controls whether the
     * solver should only use the warm start solution (and not search for other
     * initial solutions).
     */
    async solve(model, params, warmStart, log) {
        if (this.#solver !== undefined)
            throw Error("Function Solver.solve was called multiple times.");
        await this._run("solve", model, params, warmStart, log);
        if (this.#summary === undefined)
            throw Error("Internal error: 'summary' event was not received");
        return {
            // For some reason, typescript doesn't see that `summary` event can
            // overwrite `summary` variable.  It thinks that summary must be undefined.
            // So the following "as SolveSummary" is needed:
            ...this.#summary,
            objectiveHistory: this.#objectiveHistory,
            lowerBoundHistory: this.#lowerBoundHistory,
            bestSolution: this.#bestSolution,
            bestSolutionTime: this.#bestSolutionTime,
            bestLBTime: this.#bestLBTime,
            bestSolutionValid: this.#bestSolutionValid,
        };
        // TODO:1 `CP.solve` now returns a broken promise rather then returning a summary with `error: true`.
        //        Therefore we actually don't need "close" event. In normal case the last event could be "summary",
        //        in error case it should be "error".
        //        It assumes changes in the solver itself. In particular, in case of error, the solver should
        //        send "error" message and end immediately (so that the "error" message is the last one).
    }
    /** @internal */
    async _run(command, model, params, warmStart, log) {
        if (this.#solver !== undefined)
            throw Error("Attempt to use Solver multiple times.");
        if (log !== undefined)
            this.redirectOutput(log);
        if (params === undefined)
            params = {};
        let errContext = "Error while starting solver: ";
        try {
            // Start the subprocess.
            this.#solver = spawn(calcSolverPath(params), { windowsHide: true });
            // Channel error messages to the user (e.g. fails to spawn the process):
            this.#solver.on('error', (err) => {
                err.message = "Error with solver subprocess: " + err.message;
                this.emit('error', err);
                this.#closeExpected = true;
            });
            // Emit an error if solver exits unexpectedly.
            this.#solver.on('close', (code, signal) => {
                if (code === 0) {
                    if (!this.#closeExpected)
                        this.emit('error', Error('Error: Solver has ended unexpectedly with code ' + code + '.'));
                }
                else if (code !== null)
                    this.emit('error', Error('Error: Solver process has ended with code ' + code + '.'));
                else {
                    assert(signal !== null);
                    this.emit('error', Error('Error: Solver process has ended by signal ' + signal + '.'));
                }
                this.#solverClosed = true;
                if (this.#rlClosed)
                    this.emit('close');
                this.#closeExpected = true;
            });
            // Emit an error if there's a problem on stdin or stdout:
            this.#solver.stdin.on('error', (err) => {
                if (err.message === "write EPIPE") {
                    // Ignore. It is hard to avoid since writes are buffered.
                    // It could happen in particular when user calls sendSolution and the solver dies in the middle of the message.
                    return;
                }
                err.message = "Error at solver stdin: " + err.message;
                this.emit('error', err);
                this.#closeExpected = true;
            });
            this.#solver.stdout.on('error', (err) => {
                err.message = "Error at solver stdout: " + err.message;
                this.emit('error', err);
                this.#closeExpected = true;
            });
            this.#solver.stderr.on('data', (data) => {
                // Messages on stderr typically arrive in multiple chunks.
                // If we raise an error on the first chunk, then we may not see the
                // complete error message.
                // Display everything until the last newline. The part after the last
                // new line stays buffered for the next chunk.
                this.#errStreamBuffer += data.toString();
                let lastNewline = this.#errStreamBuffer.lastIndexOf('\n');
                if (lastNewline >= 0) {
                    // We have a complete message in the buffer.
                    let completeMessage = this.#errStreamBuffer.substring(0, lastNewline + 1);
                    this.#errStreamBuffer = this.#errStreamBuffer.substring(lastNewline + 1);
                    // Emit the complete message as a warning.
                    this.emit('warning', 'Solver writes on error stream:\n' + completeMessage + '\n');
                    if (this.#outputStream !== null) {
                        // Prefix every line:
                        let prefixed = completeMessage.split('\n').map(line => "Solver stderr: " + line + '\n').join('');
                        this.#outputStream.write(prefixed);
                    }
                }
                // Do not set #closeExpected to true here. We want to continue
                // reading and raise an error only once the solver dies.
            });
            // We don't react on close event on this.#solver.stdin because it may
            // arrive sooner that summary event. Instead we raise an error if we
            // attempt to write to stdin and it is not writable.
            // Create readline interface on solver stdout so that we can easily read its
            // output line by line. Every line should be a separate JSON message.
            errContext = "Error establishing interface with solver: ";
            this.#rlStdout = readline.createInterface({
                input: this.#solver.stdout,
                crlfDelay: Infinity
            });
            this.#rlClosed = false;
            this.#rlStdout.on('close', () => {
                this.#rlClosed = true;
                if (!this.#closeExpected) {
                    this.emit('error', Error('Error: Solver stdout was closed unexpectedly.'));
                    this.#closeExpected = true;
                }
                if (this.#solverClosed)
                    this.emit('close');
            });
            // Send initial handshake message
            errContext = "Error sending handshake message to the solver: ";
            this.#sendMessage({ msg: "handshake", client: "OptalCP Nodejs extension", version: Version, colors: this.#hasColors });
            // Wait for handshake message from the server and parse it. If the line
            // never comes then the rest of this code is never executed (and so there
            // is no need and even no way to check for an error here).
            errContext = "Handshake error: ";
            const [serverHandshakeLine] = await once(this.#rlStdout, 'line');
            const serverHandshake = JSON.parse(serverHandshakeLine); // throws SyntaxError that has a field message
            if (typeof serverHandshake !== 'object')
                throw Error("Invalid handshake message from the server.");
            if (serverHandshake.msg === "error")
                throw Error(serverHandshake.data);
            if (serverHandshake.msg !== 'handshake')
                throw Error("Unknown server handshake message.");
            // Wait on line events because we may already receive some errors from the server.
            this.#rlStdout.on('line', (line) => {
                try {
                    const msg = JSON.parse(line);
                    if (typeof msg != 'object' || msg.msg === undefined)
                        throw Error("Error: Not a message.");
                    switch (msg.msg) {
                        case 'error':
                            this.emit('error', Error("Error from the server: " + msg.data));
                            break;
                        case 'log':
                            if (this.#outputStream !== null)
                                this.#outputStream.write(msg.data);
                            this.emit('log', msg.data);
                            break;
                        case 'trace':
                            if (this.#outputStream !== null)
                                this.#outputStream.write(msg.data);
                            this.emit('trace', msg.data);
                            break;
                        case 'warning':
                            this.emit('warning', msg.data);
                            // msg.prefix contains possibly colored prefix "Warning: ".
                            this.#outputStream?.write(msg.prefix + msg.data);
                            break;
                        case 'solution':
                            let solution = new Solution;
                            solution._init(msg.data);
                            this.#bestSolution = solution;
                            this.#bestSolutionTime = msg.data.solveTime;
                            this.#bestSolutionValid = msg.data.verifiedOK;
                            this.#objectiveHistory.push({
                                solveTime: msg.data.solveTime,
                                objective: solution.getObjective(),
                                valid: msg.data.verifiedOK
                            });
                            this.emit('solution', { solveTime: msg.data.solveTime, valid: msg.data.verifiedOK, solution: solution });
                            break;
                        case 'domains':
                            // Event 'domains' is sent after propagate(). After this event the solver exits automatically:
                            // TODO:1 Make sure that solver never sends domains event with error=true.
                            if (!msg.data.error)
                                this.emit('domains', msg.data);
                            this.#closeExpected = true;
                            break;
                        case 'lowerBound':
                            this.#lowerBoundHistory.push(msg.data);
                            this.#bestLBTime = msg.data.solveTime;
                            this.emit('lowerBound', msg.data);
                            break;
                        case 'textModel':
                            this.emit('textModel', msg.data);
                            this.#closeExpected = true;
                            break;
                        case 'summary':
                            this.#closeExpected = true;
                            this.#summary = msg.data;
                            // TODO:1 Change server so that it doesn't send summary if there was an error.
                            if (!msg.data.error)
                                this.emit('summary', msg.data);
                            break;
                        default:
                            this.#closeExpected = true;
                            this.emit('error', Error("Unknown server message type '" + msg.msg + "'."));
                    }
                }
                catch (err) {
                    this.#closeExpected = true;
                    if (err instanceof Error) {
                        err.message = "Error parsing data from the server: " + err.message;
                        this.emit('error', err);
                    }
                    else
                        this.emit('error', Error("Unknown exception while reading from the server."));
                }
            });
            // Function write may throw an exception if the stream is already closed:
            errContext = "Error while sending the model: ";
            // Send the model to the server:
            this.#solver.stdin.write(model._serialize(command, params, warmStart) + '\n');
            errContext = ""; // Should not be needed any more
            this.#initialized = true;
            this.emit('start');
        }
        catch (err) {
            this.#closeExpected = true;
            if (err instanceof Error) {
                err.message = errContext + err.message;
                this.emit('error', err);
            }
            else
                this.emit('error', Error(errContext + "Unknown exception."));
        }
        await this.#runLoop();
    }
    // Handles communication with the server until its end. Returns false in case of an error.
    /** @internal */
    async #runLoop() {
        // On non-windows, when Ctrl-C is pressed then SIGINT is sent to whole process
        // group. I.e. it is sent to the solver too. However on windows we have to
        // inform the solver manually.
        const ctrlCHandler = () => {
            this.stop("Ctrl-C");
            process.removeListener('SIGINT', ctrlCHandler);
        };
        if (process.platform === "win32") {
            // If we get an interrupt signal during the solve then we try to stop the
            // solver.  It is done only once, i.e. if Ctrl-C is pressed twice then the
            // second press is not handled.
            // When running in parallel, we may exceed the default max number of
            // listeners on process. In this case Node.js writes a nasty warning on the
            // console. So we increase the maximum manually:
            process.setMaxListeners(Infinity);
            process.on('SIGINT', ctrlCHandler);
        }
        if (this.#outputStream !== null)
            this.#outputStream.on('error', this.#outputStreamErrorCallback);
        let hadError = false;
        try {
            // The following can throw in (because of rejected promise).
            // We want the exception to bubble up, but in any case we need to
            // remove ctrl-c handler (in case of windows).
            await once(this, 'close');
        }
        finally {
            if (process.platform === "win32")
                process.removeListener('SIGINT', ctrlCHandler);
            if (this.#outputStream !== null)
                this.#outputStream.off('error', this.#outputStreamErrorCallback);
        }
    }
    /**
     * Instruct the solver to stop ASAP.
     *
     * @param reason The reason why to stop. The reason will appear in the log.
     *
     * @remarks
     *
     * A stop message is sent to the server asynchronously. The server will
     * stop as soon as possible and will send a summary event and close event.
     * However, due to the asynchronous nature of the communication,
     * other events may be sent before the summary event (e.g., another solution
     * found or a log message).
     *
     * Requesting a stop on a solver that has already stopped has no effect.
     *
     * @example
     *
     * In the following example, we issue a stop command 1 minute after the first
     * solution is found.
     * ```ts
     * let solver = new CP.Solver;
     * timerStarted = false;
     * solver.on('solution', (_: SolutionEvent) => {
     *   // We just found a solution. Set a timeout if there isn't any.
     *  if (!timerStarted) {
     *    timerStarted = true;
     *     // Register a function to be called after 60 seconds:
     *    setTimeout(() => {
     *      console.log("Requesting solver to stop");
     *      solver.stop("Stop because I said so!");
     *    }, 60); // The timeout is 60 seconds
     *  }
     * });
     * let result = await solver.solve(model, { timeLimit: 300 });
     * ```
     *
     */
    async stop(reason) {
        if (!this.#initialized)
            await once(this, 'start');
        if (this.#closeExpected || !this.#solver.stdin.writable)
            return;
        this.#sendMessage({ msg: "stop", reason: reason });
    }
    /**
     * Send an external solution to the solver.
     *
     * @param solution The solution to send. It must be compatible with the model; otherwise, an error is raised.
     *
     * @remarks
     *
     * This function can be used to send an external solution to the solver, e.g.
     * found by another solver, a heuristic, or a user.  The solver will take
     * advantage of the solution to speed up the search: it will search only for
     * better solutions (if it is a minimization or maximization problem). The
     * solver may try to improve the provided solution by Large Neighborhood
     * Search.
     *
     * The solution does not have to be better than the current best solution
     * found by the solver. It is up to the solver whether or not it will use the
     * solution in this case.
     *
     * Sending a solution to a solver that has already stopped has no effect.
     *
     * The solution is sent to the solver asynchronously. Unless parameter
     * {@link Parameters.logLevel} is set to 0, the solver will log a message when it
     * receives the solution.
     */
    async sendSolution(solution) {
        if (!this.#initialized)
            await once(this, 'start');
        if (this.#closeExpected || !this.#solver.stdin.writable)
            return; // The solver has already stopped.
        // Message is sent asynchronously. Solver may die in the middle of the
        // message.  So the documentation is correct about ignoring solutions
        // sent about the time the solver has stopped.
        this.#sendMessage({ msg: "solution", data: solution._serialize() });
    }
    /**
     * Redirects log, trace, and warnings to the given stream. Or suppresses them when
     * `stream` is `null`.
     *
     * @param stream The stream to write the output into, or `null` to suppress the output.
     * @returns The Solver itself for chaining.
     *
     * Normally, Solver writes log, trace, and warning messages to its standard
     * output. This function allows to redirect those messages to another stream
     * (e.g., a file) or suppress them entirely.
     *
     * Note that besides writing the messages to the standard output, the solver
     * also emits events for log, trace, and warning messages. Those events can be
     * intercepted using functions {@link on}.
     *
     * If the output stream becomes non-writable (e.g., a broken pipe), then the solver
     * stops as soon as possible (function {@link stop} is called).
     *
     * @example
     *
     * In the following example, we store all the solver text output in a file
     * named `log.txt`.
     *
     * ```ts
     * import * as fs from 'fs';
     * import * as CP from '@scheduleopt/optalcp';
     *
     * ...
     * let solver = new CP.Solver;
     * solver.redirectOutput(fs.createWriteStream('log.txt'));
     * ```
     */
    redirectOutput(stream) {
        this.#outputStream = stream;
        this.#hasColors = stream === process.stdout && process.stdout.isTTY;
        return this;
    }
    /**
     * @internal
     * Unused, undocumented, but kept for the case some user needs it.
     *
     * @returns Whether the solving processed has finished.
     *
     * @remarks
     *
     * This function returns `true` if the solving process has finished.  Due to
     * asynchronicity, the solver may still emit a few events such as `close`.
     * However, when this function returns `true`, the solver ignores all
     * further commands, particularly {@link stop} or {@link sendSolution}.
     */
    _hasFinished() {
        return this.#initialized && (this.#closeExpected || !this.#solver.stdin.writable);
    }
    #sendMessage(msg) {
        // The function `write` does not wait; it writes into the internal buffer, which
        // is fed into the solver process asynchronously.
        if (this.#solver.stdin.writable)
            this.#solver.stdin.write(JSON.stringify(msg) + '\n');
        else {
            this.emit('error', "Unable to write to the solver stdin.");
            this.#closeExpected = true;
        }
    }
}
/**
 * Solve the provided model and return the result.
 *
 * @param model The model to solve.
 * @param params The parameters to use for solving.
 * @param warmStart The solution to start with.
 * @param log The stream to which the solver output (log, trace, and warnings)
 *            should be redirected. When undefined, then the output is printed
 *            on standard output. When null, then the output is suppressed.
 * @returns The result of the solve.
 *
 * @remarks
 *
 * This function is asynchronous and returns a promise. Use, e.g., `await` to wait
 * for the result.  When an error occurs, then the returned promise is rejected,
 * and the standard `Error` object is returned.
 *
 * If the `warmStart` parameter is specified, the solver will start with the
 * given solution.  The solution must be compatible with the model; otherwise,
 * an error will be raised.  The solver will take advantage of the
 * solution to speed up the search: it will search only for better solutions
 * (if it is a minimization or maximization problem). The solver may also try to
 * improve the provided solution by Large Neighborhood Search.
 *
 * To communicate asynchronously with the solver, use class {@link Solver}
 * instead.  E.g., to process every solution found or to send external solutions
 * to the solver
 *
 * For an example of using this function, see {@link Model}.
 *
 * @group Solving
 */
export async function solve(model, params, warmStart, log) {
    let solver = new Solver();
    if (log !== undefined)
        solver.redirectOutput(log);
    return solver.solve(model, params, warmStart);
}
/**
 * Translates a problem definition into a JSON format.
 *
 * @param problem The problem to export.
 * @returns A string containing the problem in JSON format.
 *
 * @remarks
 *
 * The result can be stored in a file,
 * for example.  The problem can be converted back from JSON format into an instance
 * of {@link ProblemDefinition} using function {@link json2problem}.
 *
 * @group Model exporting
 */
export function problem2json(problem) {
    return JSON.stringify(problem.model._toObject(problem.parameters, problem.warmStart));
}
/**
 * Converts a problem from JSON format into an instance of {@link ProblemDefinition}.
 *
 * @param json A string containing the problem in JSON format.
 * @returns An instance of {@link ProblemDefinition} corresponding to the model in JSON format.
 *
 * @remarks
 * It is assumed that the problem was exported using function {@link problem2json}.
 *
 * Variables in the new model can be accessed using function {@link
 * Model.getIntervalVars | Model.getIntervalVars}.
 *
 * @group Model exporting
 */
export function json2problem(json) {
    let data = JSON.parse(json);
    let model = new Model;
    model._fromObject(data);
    let params = paramsFromJSON(data.parameters);
    let warmStart = undefined;
    if (data.warmStart !== undefined) {
        warmStart = new Solution;
        warmStart._init(data.warmStart);
    }
    return { model: model, parameters: params, warmStart: warmStart };
}
/** @internal */
export async function _toText(model, cmd, params, warmStart, log = process.stdout) {
    let solver = new Solver;
    let result = undefined;
    solver.on('textModel', (msg) => { result = msg; });
    await solver._run(cmd, model, params, warmStart, log);
    if (result === undefined)
        throw Error("Internal error: 'textModel' event was not received");
    return result;
}
/**
 * Converts a problem into a text format similar to the IBM CP Optimizer file format.
 * The result is human-readable and can be stored in a file.
 *
 * @param model The model to be exported.
 * @param params The parameters to pass to the solver (they are mostly unused).
 * @param warmStart An initial solution to start the solver with.
 * @param log The stream to which the solver output should be redirected.
 *            When `undefined`, the output is printed to the standard output.
 *            When `null`, the output is suppressed.
 * @returns A string containing the model in text format.
 *
 * @remarks
 * Unlike JSON format, there is no way to convert the text format back into an
 * instance of {@link Model}.
 *
 * The result is so similar to the file format used by IBM CP Optimizer that, under
 * some circumstances, the result can be used as an input file for CP Optimizer.
 * However, some differences between OptalCP and CP Optimizer make
 * it impossible to make sure the result is always valid for CP Optimizer.
 * Known issues are:
 *
 * * OptalCP supports optional integer expressions, while CP Optimizer does not.
 *   If the model contains optional integer expressions, the result will not be
 *   valid for CP Optimizer or badly interpreted.  For example, in
 *   order to get a valid CP Optimizer file, don't use function {@link
 *   IntervalVar.start}, use {@link IntervalVar.startOr} instead.
 * * For the same reason, prefer precedence constraints such as
 *   {@link Model.endBeforeStart} over `constraint(x.end().le(y.start()))`.
 * * Negative heights in cumulative expressions (e.g., in {@link
 *   Model.stepAtStart}) are not supported by CP Optimizer.
 *
 * The function uses OptalCP solver for the conversion. Therefore, it is
 * asynchronous. To wait for the result, use the `await` keyword.
 *
 * In case of an error, this function returns a rejected promise.
 *
 * @group Model exporting
 */
export async function problem2txt(model, params, warmStart, log) {
    return _toText(model, "toText", params, warmStart, log);
}
/**
 * Converts a problem into equivalent JavaScript code. The result is human-readable.
 *
 * @param model The model to be exported.
 * @param params The parameters to pass to the solver (they are included in the generated code).
 * @param warmStart An initial solution to start the solver with.
 * @param log The stream to which the solver output should be redirected.
 *            When `undefined`, the output is printed to the standard output.
 *            When `null`, the output is suppressed.
 * @returns A string containing the model in JavaScript format.
 *
 * @remarks
 * This function is experimental, and the result is not guaranteed to be valid.
 *
 * The result of this function can be stored in a file and executed using
 * Node.js.  It is meant as a way to export a model to a format that is
 * executable, human-readable, editable, and independent of other libraries.
 *
 * In case of an error, this function returns a rejected promise.
 *
 * @group Model exporting
 * @experimental
 */
export async function problem2js(model, params, warmStart, log) {
    return _toText(model, "toJS", params, warmStart, log);
}
/**
 * @internal
 *
 * Computes domains after constraint propagation.
 *
 * @param model The model to propagate.
 * @param parameters The parameters to use for propagation.
 * @param log The stream to which the solver output should be redirected. When
 *            `undefined`, then the output is printed to the standard output.
 *            When `null`, the output is suppressed.
 * @returns The result of propagation.
 *
 * @remarks
 *
 * Propagation removes infeasible values from variable domains.
 * Generally, it shrinks the domains but doesn't fix variables to values.
 * In some cases, propagation can prove that the model is infeasible.
 *
 * Sometimes, it may be helpful to check what the solver can compute
 * by constraint propagation and what it cannot. For example,
 * if some obviously infeasible values are not removed from
 * variable domains, then some redundant constraints can be added.
 *
 * @example
 *
 * In the following example, we have 4 tasks `task[0]`, `task[1]`, `task[2]`,
 * `task[3]`, and 2 workers.  Each task can be assigned to any worker and the
 * tasks can be processed in any order. All tasks have a length 10 and must be finished
 * before time 19.
 *
 * In the first model, we will use constraints {@link Model.alternative} to
 * choose a worker for each task.  We check that constraint propagation
 * correctly propagates the length of the tasks to the workers.
 *
 * ```ts
 * let model = new CP.Model();
 * const nbTasks = 4;
 *
 * // For each task, we will create three interval variables:
 * //   * tasks[i]: the task itself
 * //   * tasksWorker1[i]: the task if executed by worker1
 * //   * tasksWorker2[i]: the task if executed by worker2
 * let tasks: CP.IntervalVar[] = [];
 * let tasksWorker1: CP.IntervalVar[] = [];
 * let tasksWorker2: CP.IntervalVar[] = [];
 *
 * for (let i = 0; i < nbTasks; i++) {
 *   // Create the task itself. It has a length 10 and must be finished before 19:
 *   tasks.push(model.intervalVar({ name: "Task" + (i + 1), length: 10, end: [, 19] }));
 *   // Create the variables for workers. Those variables are optional
 *   // since we don't know which worker will execute the task.
 *   // Notice that we don't specify the length of those interval variables.
 *   tasksWorker1.push(model.intervalVar({ name: "Task" + (i + 1) + "Worker1", optional: true }));
 *   tasksWorker2.push(model.intervalVar({ name: "Task" + (i + 1) + "Worker2", optional: true }));
 *   // Alternative constraint between the task and the two worker variables
 *   // makes sure that exactly one of the two workers executes the task:
 *   model.alternative(tasks[i], [tasksWorker1[i], tasksWorker2[i]]);
 *   // All tasks must be finished before the time 19:
 *   model.constraint(model.le(tasks[i].end(), 19));
 * }
 *
 * // Tasks of each worker cannot overlap:
 * model.noOverlap(tasksWorker1);
 * model.noOverlap(tasksWorker2);

 * try {

 *   // Propagate using the maximum propagation on noOverlap constraint:
 *   let result = await CP.propagate(model, { noOverlapPropagationLevel: 4 });
 *   if (typeof result.domains === "string") {
 *     // The model is infeasible, or a timeout occurred:
 *     console.log("The result of the propagation is: " + result.domains);
 *   } else {
 *     // Check the computed length of one of the optional tasks:
 *     console.log("Length of Task1Worker1 is: " +
 *       result.domains.getLengthMin(tasksWorker1[0]) + ".." + result.domains.getLengthMax(tasksWorker1[0]));
 *   }
 *
 * } catch (e) {
 *   // In case of an error CP.propagate returns a rejected promise, so an exception is thrown
 *   console.log("Error caught: " + e);
 * }
 * ```
 *
 * The output of the program is:
 *
 * ```text
 * Length of Task1Worker1 is: 10..10
 * ```
 *
 * As we can see, the length 10 is correctly propagated from `Task1` to `Task1Worker1`.
 * However, propagation did not prove the model is infeasible, even though there is no way
 * to execute four tasks of length 10 before time 19 using only 2 workers.
 *
 * Let's remodel this problem using a cumulative constraint. The idea is that
 * the workers are interchangeable, and we can assign tasks to workers in
 * postprocessing.
 *
 * ```ts
 * let model = new CP.Model();
 * const nbTasks = 4;
 *
 * // For each task, we will create an interval variable
 * // and also a pulse for cumulative constraint:
 * let tasks: CP.IntervalVar[] = [];
 * let pulses: CP.CumulExpr[] = [];
 *
 * for (let i = 0; i < nbTasks; i++) {
 *   // Create the task. It has a length 10 and must be finished before 19:
 *   tasks.push(model.intervalVar({ name: "Task" + (i + 1), length: 10, end: [, 19] }));
 *   // And its pulse:
 *   pulses.push(tasks[i].pulse(1));
 * }
 *
 * // Cumulative constraint makes sure that we don't use more than 2 workers at a time:
 * model.cumulSum(pulses).cumulLe(2);
 *
 * try {
 *
 *   // Propagate using the maximum propagation for cumul constraints:
 *   let result = await CP.propagate(model, { cumulPropagationLevel: 3});
 *   if (typeof result.domains === "string") {
 *     // The model is infeasible, or a timeout occurred:
 *     console.log("The result of the propagation is: " + result.domains);
 *   } else
 *     console.log("The propagation did not detect infeasibility.");
 *
 * } catch (e) {
 *   // In case of an error, CP.propagate returns a rejected promise, so an exception is thrown
 *   console.log("Error caught: " + e);
 * }
 * ```
 *
 * This time, the output is:
 *
 * ```text
 * The result of the propagation is: infeasible
 * ```
 *
 * As we can see, this model propagates more than the previous one.
 *
 * @group Propagation
 */
export async function propagate(model, parameters, log) {
    let solver = new Solver;
    let result = undefined;
    solver.on('domains', (msg) => {
        // TODO:1 Change solver so that it never sends domains message with an error.
        if (!msg.error) {
            let domains = "infeasible";
            if (msg.domains !== null)
                domains = new ModelDomains(msg.domains);
            else if (msg.limitHit)
                domains = "limit";
            result = {
                duration: msg.duration,
                memoryUsed: msg.memoryUsed,
                nbIntVars: msg.nbIntVars,
                nbIntervalVars: msg.nbIntervalVars,
                nbConstraints: msg.nbConstraints,
                domains: domains
            };
        }
    });
    await solver._run('propagate', model, parameters, undefined, log);
    if (result === undefined)
        throw new Error("Internal error in propagate: domains message not received");
    return result;
}
// === StatsHolder ===========================================================
/**
 * @internal
 * Auxiliary class for Benchmarker. Holds statistics about a single feature,
 * like a number of branches.
 */
class StatsHolder {
    size = 0;
    sum = 0;
    sumQ = 0;
    min = +Infinity;
    max = -Infinity;
    nbTimesNull = 0;
    add(value) {
        if (value !== null) {
            this.sum += value;
            this.sumQ += value * value;
            this.min = Math.min(value, this.min);
            this.max = Math.max(value, this.max);
            this.size++;
        }
        else
            this.nbTimesNull++;
    }
    getAverage() {
        if (this.size == 0)
            return 0;
        return this.sum / this.size;
    }
    getStdDev() {
        if (this.size <= 1)
            return Infinity;
        // We compute SAMPLE standard deviation because we assume that the solved
        // instances are just a sample from bigger population.
        return Math.sqrt((this.sumQ - this.sum * this.sum / this.size) / (this.size - 1));
    }
}
/** @internal */
function parseBenchParameters(params, args) {
    try {
        let unrecognized = [];
        let i = 0;
        let knownOptions = [
            "--nbseeds", "--nbparallelruns", "--minobjective", "--maxobjective",
            "--summary", "--log", "--result", "--exportjson", "--exportjs",
            "--exporttxt", "--exportdomains", "--dontsolve", "--output", "--dontoutputsolutions"
        ];
        while (i < args.length) {
            let lower = args[i].toLowerCase();
            if (!knownOptions.includes(lower)) {
                unrecognized.push(args[i]);
                i++;
                continue;
            }
            if (lower == "--dontsolve") {
                params.solve = false;
                i++;
                continue;
            }
            if (lower == "--dontoutputsolutions") {
                params.dontOutputSolutions = true;
                i++;
                continue;
            }
            if (i == args.length - 1)
                throw Error("Missing argument for command line option " + args[i] + ".");
            switch (lower) {
                case "--nbseeds":
                    params.nbSeeds = ParseNumber(args[i + 1], "nbSeeds");
                    break;
                case "--nbparallelruns":
                    params.nbParallelRuns = ParseNumber(args[i + 1], "nbParallelRuns");
                    break;
                case "--minobjective":
                    params.minObjective = ParseNumber(args[i + 1], "minObjective");
                    break;
                case "--maxobjective":
                    params.maxObjective = ParseNumber(args[i + 1], "maxObjective");
                    break;
                case "--summary":
                    params.summary = args[i + 1];
                    break;
                case "--log":
                    params.log = args[i + 1];
                    break;
                case "--exportjson":
                    params.exportJSON = args[i + 1];
                    break;
                case "--exportjs":
                    params.exportJS = args[i + 1];
                    break;
                case "--exporttxt":
                    params.exportTxt = args[i + 1];
                    break;
                case "--exportdomains":
                    params.exportDomains = args[i + 1];
                    break;
                case "--result":
                    params.result = args[i + 1];
                    break;
                case "--output":
                    params.output = args[i + 1];
                    break;
                default:
                    assert(false);
            }
            i += 2;
        }
        return unrecognized;
    }
    catch (e) {
        if (e instanceof Error)
            console.error('Error: ', e.message);
        else
            console.error('Unknown exception while parsing command-line arguments: ', e);
        process.exit(1);
    }
}
/** @internal
 * Note that the following parameter is not documented. It is functional only for internal builds:
  "  --exportDomains fileNamePattern  Export domains after the propagate into a text file\n" +
 *
*/
export const BenchmarkParametersHelp = 
// There is undocumented --exportJS parameter
"Benchmarking options:\n" +
    "  --nbSeeds uint32        Test models on given number of random seeds\n" +
    "  --nbParallelRuns uint32 Run given number of solves in parallel\n" +
    "  --minObjective double   Require given minimum objective value\n" +
    "  --maxObjective double   Require given maximum objective value\n" +
    "  --dontSolve             Not really solve. Useful, e.g., with --exportJSON\n" +
    "\n" +
    "Overall benchmarking output:\n" +
    "  --output fileName      Write detailed results of all runs into a JSON file\n" +
    "  --summary fileName     Write a summary table of all runs into a CSV file\n" +
    "  --dontOutputSolutions  Do not write solutions into the output file (save space)\n" +
    "\n" +
    "Outputs for individual benchmarking runs:\n" +
    "  --result fileNamePattern         Write a detailed result into a JSON file\n" +
    "  --log fileNamePattern            Write log into the specified text file\n" +
    "  --exportJSON fileNamePattern     Export problem into a JSON file\n" +
    "  --exportTxt fileNamePattern      Export problem into a text file\n" +
    "Where fileNamePattern undergoes the following expansion:\n" +
    "  {name}       ->  Model name (by convention name of the source data file)\n" +
    "  {flat_name}  ->  Like {name} but all characters '/' is replaced by '_'\n" +
    "  {seed}       ->  Random seed\n" +
    "\n" +
    ParametersHelp;
/**
 * Parse benchmark parameters from command line arguments.
 *
 * @group Benchmarking
 *
 * @param params Input/output argument. Contains default values of parameters
 *               that will be overridden by command line arguments.
 *               When not specified, empty object `{}` is used.
 * @param args   Command line arguments to parse. When not specified,
 *               `process.argv.slice(2)` is used.
 *
 * @remarks
 *
 * This function parses command line arguments. In case of an error,
 * it prints an error message and terminates the program. The default
 * parameters can be specified using the parameter `params`.
 *
 * When `--help` or `-h` is specified, then the function prints the `params.usage`
 * string followed by the description of supported benchmark and engine parameters,
 * and then terminates the program.
 *
 * The description of supported parameters looks like this:
 * ```text
 * Benchmarking options:
 *   --nbSeeds uint32        Test models on the given number of random seeds
 *   --nbParallelRuns uint32 Run given number of solves in parallel
 *   --minObjective double   Require given minimum objective value
 *   --maxObjective double   Require given maximum objective value
 *   --dontSolve             Not really solve. Useful, e.g., with --exportJSON
 *
 * Overall benchmarking output:
 *   --output fileName      Write detailed results of all runs into a JSON file
 *   --summary fileName     Write a summary table of all runs into a CSV file
 *   --dontOutputSolutions  Do not write solutions into the output file (save space)
 *
 * Outputs for individual benchmarking runs:
 *   --result fileNamePattern         Write a detailed result into a JSON file
 *   --log fileNamePattern            Write log into the specified text file
 *   --exportJSON fileNamePattern     Export problem into a JSON file
 *   --exportTxt fileNamePattern      Export problem into a text file
 * Where fileNamePattern undergoes the following expansion:
 *   {name}       ->  Model name (by convention name of the source data file)
 *   {flat_name}  ->  Like {name} but all characters '/' is replaced by '_'
 *   {seed}       ->  Random seed
 * Solver path:
 *   --solverPath string              Path to the solver
 *
 * Terminal output:
 *   --color Never|Auto|Always        Whether to colorize output to the terminal
 *
 * Major options:
 *   --nbWorkers uint32               Number of threads dedicated to search
 *   --searchType LNS|FDS|FDSLB|SetTimes
 *                                    Type of search to use
 *   --randomSeed uint32              Random seed
 *   --logLevel uint32                Level of the log
 *   --warningLevel uint32            Level of warnings
 *   --logPeriod double               How often to print log messages (in seconds)
 *   --verifySolutions bool           When on, the correctness of solutions is verified
 *
 * ...
 * ```
 *
 * {@link WorkerParameters} can be specified for individual worker(s) using the following prefixes:
 *
 *  * `--workerN.` or `--workersN.` for worker `N`
 *  * `--workerN-M.` or `--workersN-M.` for workers in the range `N` to `M`
 *
 * For example:
 *
 * * `--worker0.searchType FDS` sets the search type to the first worker only.
 * * `--workers4-8.noOverlapPropagationLevel 4` sets the propagation level of `noOverlap` constraint for workers 4, 5, 6, 7, and 8.
 *
 * @see {@link parseSomeBenchmarkParameters} for a version that allows unrecognized arguments.
 * @see Functions {@link parseParameters} and {@link parseSomeParameters} for
 *     parsing only solver parameters.
 */
export function parseBenchmarkParameters(params = {}, args = process.argv.slice(2)) {
    // Print help if there is -h or --help:
    handleHelp(args, params, BenchmarkParametersHelp);
    let restArgs = parseBenchParameters(params, args);
    parseParameters(params, restArgs);
    return params;
}
/**
 * Parses benchmark parameters from command line arguments and returns an array of unrecognized arguments.
 *
 * @param params Input/output argument. Contains default values of parameters
 *              that will be overridden by command line arguments.
 * @param args Command line arguments to parse. When not specified,
 *            `process.argv.slice(2)` is used.
 * @returns An array of unrecognized arguments.
 *
 * Functionally, this function is the same as {@link parseBenchmarkParameters}.
 * However, it does not exit the application in case of an unrecognized argument.
 * Instead, it returns an array of unrecognized arguments.
 *
 * @see {@link parseBenchmarkParameters} for more details.
 * @see {@link parseParameters}, {@link parseSomeParameters} for parsing only solver parameters.
 *
 * @group Benchmarking
 */
export function parseSomeBenchmarkParameters(params, args = process.argv.slice(2)) {
    handleHelp(args, params, BenchmarkParametersHelp);
    let restArgs = parseBenchParameters(params, args);
    return parseSomeParameters(params, restArgs);
}
/**
 * @internal
 * A class thats behind the function benchmark().
 */
class Benchmarker {
    // Input:
    #generator;
    #runs;
    #parameters;
    #modifications;
    #logOff;
    // For printing on console:
    #doPrint;
    #nameColLength = 30;
    #hasSeedCol;
    // Statistics:
    #branches = new StatsHolder;
    #durations = new StatsHolder;
    #restarts = new StatsHolder;
    #lnsSteps = new StatsHolder;
    #objective = new StatsHolder;
    #solveTime = new StatsHolder;
    #solutions = new StatsHolder;
    #proof = new StatsHolder;
    #lowerBound = new StatsHolder;
    #nbErrors = 0;
    #nbAbsent = 0;
    // CSV file output. Could be process.stdout, in this case normal output is suppressed.
    #summaryStream;
    // Global JSON output
    #outputStream;
    // Results of completed tasks:
    #results = new Array();
    constructor(generator, inputs, benchmarkParameters) {
        this.#generator = generator;
        this.#parameters = benchmarkParameters;
        // Modifications that will be done on the parameters of each run.
        // I.e. strip BenchmarkParameters to Parameters:
        this.#modifications = copyParameters(benchmarkParameters);
        delete this.#modifications.nbSeeds;
        delete this.#modifications.nbParallelRuns;
        delete this.#modifications.minObjective;
        delete this.#modifications.maxObjective;
        delete this.#modifications.summary;
        delete this.#modifications.log;
        delete this.#modifications.logFName;
        delete this.#modifications.result;
        delete this.#modifications.resultFName;
        delete this.#modifications.exportJSON;
        delete this.#modifications.exportTxt;
        delete this.#modifications.exportJS;
        delete this.#modifications.exportDomains;
        delete this.#modifications.solve;
        delete this.#modifications.output;
        delete this.#modifications.dontOutputSolutions;
        delete this.#modifications.usage;
        this.#runs = [];
        let nbSeeds = this.#parameters.nbSeeds ?? 1;
        this.#hasSeedCol = (nbSeeds > 1);
        for (let i = 0; i < inputs.length; i++) {
            for (let s = 0; s < nbSeeds; s++)
                this.#runs.push({ input: inputs[i], seedOffset: s, index: i });
        }
        // Whether to turn off log during solves:
        this.#logOff = this.#runs.length > 1 && this.#parameters.log === undefined;
        this.#doPrint = this.#runs.length > 1;
        let summaryFName = this.#parameters.summary;
        if (summaryFName !== undefined)
            this.#initializeCSVsummary(summaryFName);
        if (this.#parameters.output !== undefined)
            this.#initializeOutput(this.#parameters.output);
    }
    async #makeRunConfiguration(run) {
        let problem = this.#generator(run.input);
        if (problem instanceof Promise)
            problem = await problem;
        if (problem instanceof Model)
            problem = { model: problem };
        let model = problem.model;
        // Set objective bounds
        let objMin = this.#parameters.minObjective;
        let objMax = this.#parameters.maxObjective;
        if (objMin !== undefined || objMax !== undefined) {
            let primaryObjective = model.getPrimaryObjectiveExpression();
            if (primaryObjective === undefined) {
                console.error("Option min/maxObjective was used but the model has no objective.");
                process.exit(1);
            }
            if (objMin !== undefined)
                model.constraint(model.le(objMin, primaryObjective));
            if (objMax != undefined)
                model.constraint(model.le(primaryObjective, objMax));
        }
        let inputParameters = problem.parameters === undefined ? {} : copyParameters(problem.parameters);
        let parameters = combineParameters(inputParameters, this.#modifications);
        let name = problem.model.getName();
        if (name === undefined)
            name = "Problem" + (run.index + 1);
        let seed = (parameters.randomSeed ?? 1) + run.seedOffset;
        parameters.randomSeed = seed;
        let conf = { model, parameters, warmStart: problem.warmStart, name: name, seed: seed };
        conf.logFName = this.#expandPattern(this.#parameters.log, conf);
        conf.resultFName = this.#expandPattern(this.#parameters.result, conf);
        conf.exportJSON = this.#expandPattern(this.#parameters.exportJSON, conf);
        conf.exportJS = this.#expandPattern(this.#parameters.exportJS, conf);
        conf.exportTxt = this.#expandPattern(this.#parameters.exportTxt, conf);
        conf.exportDomains = this.#expandPattern(this.#parameters.exportDomains, conf);
        return conf;
    }
    #expandPattern(pattern, config) {
        if (pattern === undefined)
            return undefined;
        let flatName = config.name.replaceAll("/", "_");
        let result = pattern
            .replaceAll("{name}", config.name)
            .replaceAll("{flat_name}", flatName)
            .replaceAll("{seed}", config.seed.toString());
        if (result.includes("{") && result.includes("}")) {
            console.error("Unknown {...} expansion: '" + pattern + "'.");
            process.exit(1);
        }
        return result;
    }
    #updateStats(r) {
        if (r.error !== undefined) {
            this.#nbErrors++;
            return;
        }
        if (r.objective !== undefined) {
            let o = Array.isArray(r.objective) ? r.objective[0] : r.objective;
            if (Number.isNaN(o))
                this.#nbAbsent++;
            else
                this.#objective.add(o);
        }
        this.#branches.add(r.nbBranches);
        this.#lnsSteps.add(r.nbLNSSteps);
        this.#restarts.add(r.nbRestarts);
        this.#durations.add(r.duration);
        this.#proof.add(r.proof ? 1 : 0);
        if (r.lowerBound !== undefined) {
            if (Array.isArray(r.lowerBound))
                this.#lowerBound.add(r.lowerBound[0]);
            else
                this.#lowerBound.add(r.lowerBound);
        }
        this.#solutions.add(r.nbSolutions);
        if (r.bestSolutionTime !== undefined)
            this.#solveTime.add(r.bestSolutionTime);
    }
    #printSeparator() {
        let separator = "--------------------------------------------------------------------------------------------------------------------";
        if (this.#hasSeedCol)
            separator += "----------";
        if (this.#nameColLength > 0) {
            for (let i = 0; i < this.#nameColLength; i++)
                separator += "-";
            if (this.#hasSeedCol)
                separator += "--"; // Space between Model and Seed columns
        }
        console.log(separator);
    }
    #printHeader() {
        if (this.#summaryStream === process.stdout)
            return; // We're outputting CSV directly
        console.log("Number of solves to run: " + this.#runs.length);
        let header = "   Run ";
        if (this.#nameColLength > 0)
            header += "Model".padEnd(this.#nameColLength);
        if (this.#hasSeedCol)
            header += "Seed".padStart(10);
        header +=
            "Status".padStart(13) +
                "LowerBound".padStart(12) +
                "Objective".padStart(12) +
                "Time".padStart(12) +
                "Sol.time".padStart(12) +
                "Solutions".padStart(12) +
                "LNS steps".padStart(12) +
                "Restarts".padStart(12) +
                "Branches".padStart(12);
        console.log(header);
        this.#printSeparator();
    }
    #printRun(iteration, r) {
        if (!this.#doPrint)
            return;
        if (this.#summaryStream === process.stdout)
            return; // We're outputting CSV directly
        let line = this.#results.length.toString().padStart(6) + " ";
        if (this.#nameColLength > 0) {
            let name = (r.modelName || "unknown");
            if (name.length > this.#nameColLength)
                name = "..." + name.substring(name.length - this.#nameColLength + 3);
            line += name.padEnd(this.#nameColLength);
        }
        if (this.#hasSeedCol)
            line += iteration.seed.toString().padStart(10);
        let f = this.#formatResult(r);
        line +=
            f.status.padStart(13) +
                f.lowerBound.padStart(12) +
                f.objective.padStart(12) +
                f.duration.padStart(12) +
                f.solutionTime.padStart(12) +
                f.nbSolutions.padStart(12) +
                f.nbLNSSteps.padStart(12) +
                f.nbRestarts.padStart(12) +
                f.nbBranches.padStart(12);
        console.log(line);
    }
    #formatObjectiveValue(objective) {
        if (objective === undefined)
            return "";
        if (objective === null)
            return "absent";
        return objective.toString();
    }
    // Computes components of the solve result as strings easy formatting. E.g.
    // computes solve status. Used for both console output and CSV output.
    #formatResult(r) {
        let result = {
            name: r.modelName,
            seed: r.parameters.randomSeed,
            status: "ERROR",
            objective: "",
            lowerBound: "",
            solutionTime: "",
            lbTime: "",
            duration: "",
            nbSolutions: "",
            nbLNSSteps: "",
            nbRestarts: "",
            nbBranches: "",
            nbFails: "",
            memoryUsed: "",
            nbIntVars: "",
            nbIntervalVars: "",
            nbConstraints: "",
            solver: "",
            nbWorkers: "",
            cpu: "",
            solveDate: r.solveDate.toISOString()
        };
        if (r.error !== undefined)
            return result;
        if (r.nbSolutions == 0) {
            if (r.proof)
                result.status = "Infeasible";
            else
                result.status = "No solution";
        }
        else {
            if (r.proof)
                result.status = "Optimum";
            else
                result.status = "Solution";
        }
        result.lowerBound = this.#formatObjectiveValue(r.lowerBound);
        result.objective = this.#formatObjectiveValue(r.objective);
        result.duration = r.duration.toFixed(2);
        result.solutionTime = r.bestSolutionTime === undefined ? "" : r.bestSolutionTime.toFixed(2);
        result.lbTime = r.bestLBTime === undefined ? "" : r.bestLBTime.toFixed(2);
        result.nbSolutions = r.nbSolutions.toString();
        result.nbRestarts = r.nbRestarts.toString();
        result.nbLNSSteps = r.nbLNSSteps.toString();
        result.nbBranches = r.nbBranches.toString();
        result.nbFails = r.nbFails.toString();
        result.memoryUsed = r.memoryUsed.toString();
        result.nbIntVars = r.nbIntVars.toString();
        result.nbIntervalVars = r.nbIntervalVars.toString();
        result.nbConstraints = r.nbConstraints.toString();
        result.nbWorkers = r.nbWorkers.toString();
        result.cpu = r.cpu;
        result.solver = r.solver;
        return result;
    }
    #printStatistics() {
        if (this.#summaryStream === process.stdout)
            return; // We're outputting CSV directly
        this.#printSeparator();
        let skip = this.#nameColLength;
        if (this.#hasSeedCol)
            skip += 10;
        let prefix = "          ";
        for (let i = 0; i < skip; i++)
            prefix += " ";
        console.log(prefix +
            "Mean: ".padStart(10) +
            this.#lowerBound.getAverage().toPrecision(9).padStart(12) +
            this.#objective.getAverage().toPrecision(9).padStart(12) +
            this.#durations.getAverage().toFixed(2).padStart(12) +
            this.#solveTime.getAverage().toFixed(2).padStart(12) +
            this.#solutions.getAverage().toFixed(2).padStart(12) +
            this.#lnsSteps.getAverage().toFixed(0).padStart(12) +
            this.#restarts.getAverage().toFixed(0).padStart(12) +
            this.#branches.getAverage().toFixed(0).padStart(12));
        console.log(prefix +
            "Std. Dev: ".padStart(10) +
            this.#lowerBound.getStdDev().toPrecision(9).padStart(12) +
            this.#objective.getStdDev().toPrecision(9).padStart(12) +
            this.#durations.getStdDev().toFixed(2).padStart(12) +
            this.#solveTime.getStdDev().toFixed(2).padStart(12) +
            this.#solutions.getStdDev().toFixed(2).padStart(12) +
            this.#lnsSteps.getStdDev().toFixed(0).padStart(12) +
            this.#restarts.getStdDev().toFixed(0).padStart(12) +
            this.#branches.getStdDev().toFixed(0).padStart(12));
        console.log(prefix +
            "Min: ".padStart(10) +
            this.#lowerBound.min.toPrecision(9).padStart(12) +
            this.#objective.min.toPrecision(9).padStart(12) +
            this.#durations.min.toFixed(2).padStart(12) +
            this.#solveTime.min.toFixed(2).padStart(12) +
            this.#solutions.min.toFixed(2).padStart(12) +
            this.#lnsSteps.min.toFixed(0).padStart(12) +
            this.#restarts.min.toFixed(0).padStart(12) +
            this.#branches.min.toFixed(0).padStart(12));
        console.log(prefix +
            "Max: ".padStart(10) +
            this.#lowerBound.max.toPrecision(9).padStart(12) +
            this.#objective.max.toPrecision(9).padStart(12) +
            this.#durations.max.toFixed(2).padStart(12) +
            this.#solveTime.max.toFixed(2).padStart(12) +
            this.#solutions.max.toFixed(2).padStart(12) +
            this.#lnsSteps.max.toFixed(0).padStart(12) +
            this.#restarts.max.toFixed(0).padStart(12) +
            this.#branches.max.toFixed(0).padStart(12));
    }
    #writeRange(min, max) {
        if (min == max)
            return "" + min;
        return min + ".." + max;
    }
    #writeDomains(model, propagationResult) {
        if (propagationResult.domains === "infeasible")
            return "Model is infeasible";
        if (propagationResult.domains === "limit")
            return "Limit hit during propagate.";
        const domains = propagationResult.domains;
        let result = "";
        for (const v of model.getBoolVars()) {
            let name = v.getName();
            if (name === undefined)
                name = "BoolVar" + v._getId();
            result += name + ": ";
            if (domains.isAbsent(v))
                result += "absent";
            else {
                if (domains.isOptional(v))
                    result += "optional ";
                result += this.#writeRange(domains.getMin(v), domains.getMax(v));
            }
            result += '\n';
        }
        for (const v of model.getIntVars()) {
            let name = v.getName();
            if (name === undefined)
                name = "IntVar" + v._getId();
            result += name + ": ";
            if (domains.isAbsent(v))
                result += "absent";
            else {
                if (domains.isOptional(v))
                    result += "optional ";
                result += this.#writeRange(domains.getMin(v), domains.getMax(v));
            }
            result += '\n';
        }
        for (const v of model.getIntervalVars()) {
            let name = v.getName();
            if (name === undefined)
                name = "IntervalVar" + v._getId();
            result += name + ": ";
            if (domains.isAbsent(v))
                result += "absent";
            else {
                if (domains.isOptional(v))
                    result += "optional, ";
                result += "start: " + this.#writeRange(domains.getStartMin(v), domains.getStartMax(v));
                result += ", end: " + this.#writeRange(domains.getEndMin(v), domains.getEndMax(v));
                result += ", length: " + this.#writeRange(domains.getLengthMin(v), domains.getLengthMax(v));
            }
            result += '\n';
        }
        return result;
    }
    async #callSolve(config) {
        let errContext = "";
        try {
            errContext = "Cannot open log file '" + config.logFName + "'";
            let logStream = config.logFName === undefined ? process.stdout : fs.createWriteStream(config.logFName);
            if (this.#logOff)
                logStream = null;
            if (config.exportDomains !== undefined) {
                errContext = "Cannot export domains into file '" + config.exportDomains + "'";
                let result = await propagate(config.model, config.parameters, logStream);
                let domains = this.#writeDomains(config.model, result);
                await fs.promises.writeFile(config.exportDomains, domains);
            }
            // Default result when solve is not called:
            let result = {
                error: undefined,
                nbSolutions: 0,
                proof: false,
                duration: 0,
                nbBranches: 0,
                nbFails: 0,
                nbLNSSteps: 0,
                nbRestarts: 0,
                memoryUsed: 0,
                objectiveHistory: [],
                lowerBoundHistory: [],
                nbIntVars: 0,
                nbIntervalVars: 0,
                nbConstraints: 0,
                nbWorkers: 0,
                cpu: "",
                solver: "",
                solveDate: new Date(),
                parameters: config.parameters,
                modelName: config.name,
                objectiveSense: undefined
            };
            // By default #parameters.solve is undefined what means true. So we compare the following way:
            if (this.#parameters.solve !== false) {
                const oldLogLevel = config.parameters.logLevel;
                if (this.#logOff)
                    config.parameters.logLevel = 0;
                errContext = "Error while solving the model";
                let solveResult = await solve(config.model, config.parameters, config.warmStart, logStream);
                // Restore old logLevel for the case we call export below:
                config.parameters.logLevel = oldLogLevel;
                result = { ...solveResult, parameters: config.parameters, modelName: config.name, solveDate: new Date(), error: undefined };
            }
            // Exports are done after solve so it can contain solution as a warm start:
            if (config.exportJSON !== undefined) {
                errContext = "Cannot export JSON model into file '" + config.exportJSON + "': ";
                await fs.promises.writeFile(config.exportJSON, problem2json({ model: config.model, parameters: config.parameters, warmStart: result.bestSolution }));
            }
            if (config.exportTxt !== undefined) {
                errContext = "Cannot export problem into Txt file '" + config.exportTxt + "'";
                let txt = await problem2txt(config.model, config.parameters, result.bestSolution, logStream);
                if (txt === undefined)
                    throw "No content generated.";
                await fs.promises.writeFile(config.exportTxt, txt);
            }
            if (config.exportJS !== undefined) {
                errContext = "Cannot export problem into JS file '" + config.exportJS + "'";
                let js = await problem2js(config.model, config.parameters, result.bestSolution, logStream);
                if (js === undefined)
                    throw "No content generated.";
                await fs.promises.writeFile(config.exportJS, js);
            }
            return result;
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(errContext + ": " + err.message);
                return { error: errContext + err.message, solveDate: new Date(), parameters: config.parameters, modelName: config.name };
            }
            else
                return { error: "Unknown error caught", solveDate: new Date(), parameters: config.parameters, modelName: config.name };
        }
    }
    async #runIteration(input) {
        let iteration = await this.#makeRunConfiguration(input);
        let result = await this.#callSolve(iteration);
        this.#updateStats(result);
        if (iteration.resultFName !== undefined)
            fs.writeFile(iteration.resultFName, JSON.stringify(result), err => {
                if (err)
                    console.error("Cannot write benchmark result to file '" + iteration.resultFName + "': " + err);
            });
        // Delete the solution if required (to save memory):
        if (this.#parameters.dontOutputSolutions === true && result.error === undefined)
            result.bestSolution = undefined;
        this.#results.push(result);
        this.#printRun(iteration, result);
        this.#appendCSVsummary(result);
        let stream = this.#outputStream;
        if (stream !== undefined) {
            // In JSON, trailing commas are not allowed.
            let comma = this.#results.length > 1 ? ",\n" : "";
            stream.write(comma + JSON.stringify(result), err => {
                if (err)
                    console.error("Cannot write into benchmark output file '" + this.#parameters.output + "': ", err);
            });
        }
    }
    async run() {
        let ctrlCPressed = false;
        const ctrlCHandler = () => { ctrlCPressed = true; console.log(" Aborting (Ctrl-C pressed)."); };
        process.on('SIGINT', ctrlCHandler);
        if (this.#runs.length == 1) {
            await this.#runIteration(this.#runs[0]);
            this.#finalizeOutput();
            process.removeListener('SIGINT', ctrlCHandler);
            return this.#results;
        }
        this.#printHeader();
        // queue is an array of currently running solve (their promises)
        let queue = [];
        for (let i = 0; i < this.#runs.length; i++) {
            // Start new solve and add its promise to the queue.  Then use
            // Promise.race to wait for the first solve to complete. However,
            // Promise.race won't tell us which promise has finished (what is its
            // index in the queue).  Therefore we chain the functions so that the
            // finished promise removes itself from the queue automatically:
            const p = this.#runIteration(this.#runs[i]).then(() => {
                queue.splice(queue.indexOf(p), 1);
            });
            queue.push(p);
            if (queue.length >= (this.#parameters.nbParallelRuns ?? 1)) {
                await Promise.race(queue);
            }
            if (ctrlCPressed)
                break;
        }
        process.removeListener('SIGINT', ctrlCHandler);
        // Wait for the remaining solves to finish
        await Promise.all(queue);
        this.#finalizeOutput();
        this.#printStatistics();
        return this.#results;
    }
    #initializeCSVsummary(filename) {
        if (filename === '-')
            this.#summaryStream = process.stdout;
        else {
            try {
                this.#summaryStream = fs.createWriteStream(filename);
            }
            catch (err) {
                console.error("Cannot open summary file '" + filename + "': ", err);
                process.exit(1);
            }
        }
        this.#summaryStream.write("Model name;Random seed;Status;Objective;Lower bound;Time;Last solution time;LB time;Solutions;LNS " +
            "steps;Restarts;Branches;Fails;Memory;Int Vars;IntervalVars;Constraints;Solver;Workers;Time limit;Parameters;CPU;Date\n", err => { if (err)
            console.error("Cannot write into benchmark summary file '" + filename + "': ", err); });
    }
    #initializeOutput(filename) {
        try {
            this.#outputStream = fs.createWriteStream(filename);
        }
        catch (err) {
            console.error("Cannot open output file '" + filename + "': ", err);
            process.exit(1);
        }
        this.#outputStream.write("[\n", err => {
            if (err)
                console.error("Cannot write into benchmark output file '" + filename + "': ", err);
        });
    }
    #finalizeOutput() {
        let stream = this.#outputStream;
        if (stream === undefined)
            return;
        stream.write("\n]", err => {
            if (err)
                console.error("Cannot write into benchmark output file '" + this.#parameters.output + "': ", err);
        });
    }
    #appendCSVsummary(r) {
        let stream = this.#summaryStream;
        if (stream === undefined)
            return;
        let f = this.#formatResult(r);
        let line = f.name + ";" +
            f.seed + ";" +
            f.status + ";" +
            f.objective + ";" +
            f.lowerBound + ";" +
            f.duration + ";" +
            f.solutionTime + ";" +
            f.lbTime + ";" +
            f.nbSolutions + ";" +
            f.nbLNSSteps + ";" +
            f.nbRestarts + ";" +
            f.nbBranches + ";" +
            f.nbFails + ";" +
            f.memoryUsed + ";" +
            f.nbIntVars + ";" +
            f.nbIntervalVars + ";" +
            f.nbConstraints + ";" +
            '"' + f.solver + '";' +
            f.nbWorkers + ";" +
            r.parameters.timeLimit + ";" +
            '"' + parametersToCLA(r.parameters) + '";' +
            '"' + f.cpu + '";' +
            '"' + f.solveDate + '"\n';
        stream.write(line, err => {
            if (err)
                console.error("Cannot write into benchmark summary file '" + this.#parameters.summary + "': ", err);
        });
    }
}
// TODO:3 An option to turn off the printing?
// TODO:1 Safety checks. If one iteration says that best cost is 5 then, incase
//        of minimization, another iteration cannot find solution with cost 4.
// TODO:3 Be more interactive(?). The last line can change during the solve in the
//        same period as log period in the search.
//        It is possible to draw on screen using readline.cursorTo.
/**
 * Benchmark the given model or a set of models.
 *
 * @param problemGenerator A function that takes an input and returns a
 *                         {@link ProblemDefinition} or a {@link Model}.
 *                         The function will be called for each input in the array `inputs`.
 * @param inputs An array of inputs to the problem generator.
 * @param params Benchmark parameters to use (it includes {@link Parameters} of the solver).
 * @returns An array of results, one for each run.
 *
 * @remarks
 *
 * This function is used to run benchmarks of the solver. It can be used to
 * solve a single model or multiple models. The models can be generated from
 * data files, or they can be generated on the fly. The function can also
 * export the models into JSON, JavaScript, or text formats.
 *
 * The function will call the given `problemGenerator` for each input in the
 * array `inputs`.  The input can be anything; it is up to the problem generator
 * to interpret it (it could be, e.g., a name of a a file).  The problem
 * generator should return either a {@link Model} or a {@link ProblemDefinition}
 * (a model with parameters and a warm start).  Then, the function will solve the
 * model and return an array of results.
 *
 * Using {@link BenchmarkParameters} it is possible to specify additional
 * parameters of the benchmark. For example:
 *
 * * Each problem can be solved multiple times with different random
 *   random seeds (using parameter
 *   {@link BenchmarkParameters.nbSeeds | BenchmarkParameters.nbSeeds}).
 *   This is useful for getting more reliable statistics about the problem's performance.
 * * Multiple models can be solved in parallel to speed up the
 *   computation (using parameter
 *   {@link BenchmarkParameters.nbParallelRuns |
 *   BenchmarkParameters.nbParallelRuns}). In this case, it is useful to limit
 *   the  number of threads for each solve by parameter
 *   {@link Parameters.nbWorkers | Parameters.nbWorkers}.
 * * The function can also output the results in CSV or JSON formats
 *   or export the models into JSON, JavaScript, or text formats.
 *
 * See {@link BenchmarkParameters} for more details.
 *
 * If multiple models are solved (or one model with multiple seeds), this
 * function suppresses the normal output, and instead, it prints a table with
 * statistics of the runs. The table is printed on the standard output.
 *
 * If the array `inputs` is empty, the function writes an error message
 * to the standard output and terminates the program with exit code 1.
 *
 * In case of an error during solve, the function does not throw an exception
 * but returns {@link ErrorBenchmarkResult} for the given run.
 *
 * As {@link BenchmarkParameters} are an extension of {@link Parameters},
 * the parameter `params` can overwrite parameters for all solves.
 * If `problemGenerator` returns a {@link ProblemDefinition}, then the
 * parameters from the problem definition are used as a base, and the parameters
 * from `params` are used to overwrite them (using {@link combineParameters}).
 *
 * @example
 *
 * Suppose we have a function `createModel` that takes a filename as
 * a parameter and returns {@link Model}. For example, the function can model
 * the jobshop problem and read the data from a file.
 *
 * We are going to create a command line application around `createModel`
 * that allows solving multiple models, using multiple random seeds,
 * run benchmarks in parallel, store results in files, etc.
 *
 * ```ts
 * import * as CP from '@scheduleopt/optalcp';
 *
 * function createModel(filename: string): CP.Model {
 *   ...
 * }
 *
 *
 * let params: CP.BenchmarkParameters = {
 *   // What to print when --help is specified (assuming that the program name is mybenchmark.js):
 *   usage: "Usage: node mybenchmark.js [options] <datafile1> [<datafile2> ...",
 *   // Unless specified differently on the command line, the time limit will be 60s:
 *   timeLimit: 60
 * }
 * // Parse command line arguments. Unrecognized arguments are assumed to be file names:
 * let filenames = CP.parseSomeBenchmarkParameters(params);
 *
 * // And run the benchmark. The benchmark will call createModel for each file in filenames.
 * CP.benchmark(createModel, filenames, params);
 * ```
 *
 * The resulting program can be used, for example, as follows:
 *
 * ```shell
 * node mybenchmark.js --nbParallelRuns 2 --nbWorkers 2 --worker0.noOverlapPropagationLevel 4 \
 *   --output results.json --summary summary.csv --log `logs/{name}.txt` \
 *   data/*.txt
 * ```
 *
 * In this case, the program will solve all benchmarks from the directory `data`, running
 * two solves in parallel, each with two workers (threads). The first worker will use
 * propagation level 4 for the {@link Model.noOverlap}  constraint. The results will be
 * stored in JSON file `results.json` (an array of {@link BenchmarkResult} objects),
 * a summary will be stored in CSV file `summary.csv`, and the log files for individual
 * runs will be stored in the directory `logs` (one file for each run named
 * after the model, see {@link Model.setName | Model.setName}.
 *
 * @group Benchmarking
 *
 */
export async function benchmark(problemGenerator, inputs, params) {
    if (inputs.length == 0) {
        console.error("No inputs specified.");
        process.exit(1);
    }
    let benchmarker = new Benchmarker(problemGenerator, inputs, params);
    return benchmarker.run();
}
//# sourceMappingURL=index.js.map