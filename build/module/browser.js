/*
 * Copyright (C) CoEnzyme SAS - All Rights Reserved
 *
 * This source code is protected under international copyright law.  All rights
 * reserved and protected by the copyright holders.
 * This file is confidential and only available to authorized individuals with the
 * permission of the copyright holders.  If you encounter this file and do not have
 * permission, please contact the copyright holders and delete this file.
 */
function assert(condition, message) {
    if (!condition)
        throw new Error(message ?? 'Assertion failed');
}
// The following typedoc comment is for constant Version that is added by generate_ts:
/**
 * The version of the module, such as "1.0.0".
 * @category Constants
 */
export const Version = "2026.1.0";
// === Compilation options ===================================================
// Compilation options could be replaced by constants during bundling.
const TYPE_CHECK_LEVEL = 2; // 0: test nothing, 1: test only integers (for ts), 2: test everything (for js)
// === External interfaces ===================================================
/**
 * @remarks
 * Maximum value of a decision variable or a decision expression (such as `x+1` where `x` is a variable).
 *
 * Arithmetic expressions must stay within the range [{@link IntVarMin}, {@link IntVarMax}]. If an expression exceeds this range for all possible variable assignments, the model becomes infeasible.
 *
 * @example
 *
 * The following model is infeasible because `x*x` exceeds `IntVarMax` for all values in the variable's domain:
 *
 * ```ts
 * let model = new CP.Model();
 * let x = model.intVar({range: [10000000, 20000000]});
 * // Constraint x*x >= 1:
 * model.enforce(x.times(x).ge(1));
 * let result = await model.solve();
 * ```
 *
 * For any value of `x` in the range [10000000, 20000000], the expression `x*x` exceeds {@link IntVarMax} and cannot be computed, making the model infeasible.
 *
 * @category Constants
 */
export const IntVarMax = 1073741823;
/**
 * @remarks
 * Minimum value of a decision variable or a decision expression (such as `x+1` where `x` is a variable).
 * The opposite of {@link IntVarMax}.
 *
 * Use `IntVarMin` when you need to allow the full range of negative values for an integer variable.
 *
 * @example
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * // IntVarMin is the minimum allowed value for integer variables
 * const x = model.intVar({ min: CP.IntVarMin, max: 0, name: "x" });
 * ```
 *
 * @category Constants
 */
export const IntVarMin = -IntVarMax;
/**
 * @remarks
 * Maximum value of start or end of an interval variable. The opposite of {@link IntervalMin}.
 *
 * Use `IntervalMax` when you want to leave the end time of an interval variable unconstrained.
 *
 * @example
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * // IntervalMax is the maximum allowed value for interval start/end
 * const task = model.intervalVar({ end: [0, CP.IntervalMax], length: 10, name: "task" });
 * ```
 *
 * @category Constants
 */
export const IntervalMax = 715827882;
/**
 * @remarks
 * Minimum value of start or end of an interval variable. The opposite of {@link IntervalMax}.
 *
 * Use `IntervalMin` when you want to leave the start time of an interval variable unconstrained.
 *
 * @example
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * // IntervalMin is the minimum allowed value for interval start/end
 * const task = model.intervalVar({ start: [CP.IntervalMin, 0], length: 10, name: "task" });
 * ```
 *
 * @category Constants
 */
export const IntervalMin = -715827882;
/**
 * @remarks
 * Maximum length of an interval variable. The maximum length can be achieved by
 * an interval that starts at {@link IntervalMin} and ends at {@link IntervalMax}.
 *
 * Use `LengthMax` when you want to leave the length of an interval variable unconstrained.
 *
 * @example
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * // LengthMax is the maximum allowed length for an interval variable
 * const task = model.intervalVar({ length: [0, CP.LengthMax], name: "task" });
 * ```
 *
 * @category Constants
 */
export const LengthMax = IntervalMax - IntervalMin;
/** @internal */
export const FloatVarMax = Number.MAX_VALUE;
/** @internal */
export const FloatVarMin = -FloatVarMax;
// WebSocket implementation of SolverConnection.
// Shared code - works in both Node.js 22+ (native WebSocket) and browsers.
// Handles line buffering since WebSocket messages may span multiple lines
// or contain partial lines.
class WebSocketSolverConnection {
    #ws;
    #handlers;
    #buffer = "";
    #closed = false;
    #pendingSend;
    constructor(serverUrl, handlers) {
        this.#handlers = handlers;
        this.#ws = new WebSocket(serverUrl);
        this.#ws.onopen = () => {
            // Send any data that was queued before connection opened
            if (this.#pendingSend !== undefined) {
                this.#ws.send(this.#pendingSend);
                this.#pendingSend = undefined;
            }
        };
        this.#ws.onmessage = (event) => {
            // Buffer incoming data and emit complete lines
            const data = typeof event.data === 'string' ? event.data : event.data.toString();
            this.#buffer += data;
            // Process complete lines
            let newlineIndex;
            while ((newlineIndex = this.#buffer.indexOf('\n')) >= 0) {
                const line = this.#buffer.substring(0, newlineIndex);
                this.#buffer = this.#buffer.substring(newlineIndex + 1);
                if (line.length > 0)
                    this.#handlers.onMessage(line);
            }
        };
        this.#ws.onclose = (event) => {
            if (this.#closed)
                return;
            this.#closed = true;
            // Emit any remaining buffered data as final line
            if (this.#buffer.length > 0) {
                this.#handlers.onMessage(this.#buffer);
                this.#buffer = "";
            }
            // Non-normal close is an error (code 1000 = normal closure)
            if (event.code !== 1000 && event.code !== 1005) {
                // 1005 = "No Status Rcvd" - normal for some servers
                const reason = event.reason || `WebSocket closed with code ${event.code}`;
                this.#handlers.onError(new Error(reason));
            }
            this.#handlers.onClose();
        };
        this.#ws.onerror = (event) => {
            // Node.js native WebSocket doesn't call onclose after onerror for connection failures.
            // We need to handle the error here and close the connection ourselves.
            if (this.#closed)
                return;
            this.#closed = true;
            // Extract error message if available (browser vs Node.js have different event types)
            let errorMessage = 'WebSocket connection failed';
            if ('message' in event && typeof event.message === 'string')
                errorMessage = event.message;
            this.#handlers.onError(new Error(errorMessage));
            this.#handlers.onClose();
        };
    }
    send(data) {
        if (this.#closed)
            return;
        const message = data + '\n';
        if (this.#ws.readyState === WebSocket.CONNECTING) {
            // Queue for sending after connection opens
            this.#pendingSend = (this.#pendingSend ?? "") + message;
        }
        else if (this.#ws.readyState === WebSocket.OPEN) {
            this.#ws.send(message);
        }
        // If CLOSING or CLOSED, silently drop (consistent with NodeSolverConnection behavior)
    }
    close() {
        if (!this.#closed) {
            this.#closed = true;
            this.#ws.close();
        }
    }
}
// === Model nodes ===========================================================
/**
 * @remarks
 * The base class for all modeling objects.
 *
 * @example
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let start = model.start(x);
 * let result = await model.solve();
 * ```
 *
 * Interval variable `x` and expression `start` are both instances of {@link ModelElement}.
 * There are specialized descendant classes such as {@link IntervalVar} and {@link IntExpr}.
 *
 * Any modeling object can be assigned a name using the {@link ModelElement.name} property.
 *
 * @category Modeling
 */
export class ModelElement {
    // Factory pattern using Object.create() to avoid V8 deoptimization.
    // Using `new` would call constructors with different `this` maps from different
    // subclass hierarchies, causing "wrong map" deopts. Object.create() sets up
    // the prototype chain (so instanceof works) without calling any constructors.
    _props;
    _cp;
    // This is how this node is referred when it is used in an expression.
    // There are two ways:
    //  * { arg: this._props } when it is used only once
    //  * { ref: 12345 } when it is used multiple times
    // The idea is that _arg mutates from the first version to the second version
    // when it is used for the second time.
    // V8-friendly: always same shape, mutate in place, never use delete operator.
    // JSON.stringify omits undefined values, so serialization is unchanged.
    _arg;
    /**
     * The name assigned to this model element.
     *
     * @remarks
     * The name is optional and primarily useful for debugging purposes. When set,
     * it helps identify the element in solver logs, error messages, and when
     * inspecting solutions.
     *
     * Names can be assigned to any model element including variables, expressions,
     * and constraints.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     *
     * // Name a variable at creation
     * const task = model.intervalVar({ length: 10, name: "assembly" });
     *
     * // Or set name later
     * const x = model.intVar({ min: 0, max: 100 });
     * x.name = "quantity";
     *
     * console.log(task.name);  // "assembly"
     * console.log(x.name);     // "quantity"
     * ```
     */
    get name() { return this._props.name; }
    set name(value) { this._props.name = value; }
    /** @internal @deprecated Use `name` property instead */
    setName(name) { this._props.name = name; }
    /** @internal @deprecated Use `name` property instead */
    getName() { return this._props.name; }
    /** @internal */
    _getProps() { return this._props; }
    // Get (and create or mutate) #arg:
    /** @internal */
    _getArg() {
        if (this._arg.ref !== undefined)
            return this._arg;
        if (this._arg.arg !== undefined) {
            // Second use: upgrade to ref, mutate in place
            this._arg.ref = this._cp._getNewRefId(this._props);
            this._arg.arg = undefined; // Set to undefined, don't delete!
            return this._arg;
        }
        // First use: inline props
        this._arg.arg = this._props;
        return this._arg;
    }
    /** @internal */
    _getId() {
        return this._arg.ref;
    }
}
/**
 * @internal
 */
class Directive extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        // Avoid calling constructor chain to prevent V8 deoptimization:
        const instance = Object.create(Directive.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        cp._addDirective(instance);
        return instance;
    }
}
/**
 * @internal
 */
class ArrayNode extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(ArrayNode.prototype);
        instance._cp = cp;
        instance._props = { func, args: Array.isArray(args) ? args : [args] };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
}
/**
 * @internal
 */
export class Constraint extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(Constraint.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        cp._addConstraint(instance);
        return instance;
    }
}
// If we don't document FloatExpr, then it is not visible that IntExpr derives
// from ModelElement.
/**
 * @remarks
 * A class representing floating-point expression in the model.
 * Currently, there is no way to create floating-point expressions.
 * The class is only a base class for {@link IntExpr}.
 *
 * @category Modeling
 */
export class FloatExpr extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(FloatExpr.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
    /** @internal */
    _reusableFloatExpr() {
        let outParams = [this._getArg()];
        return FloatExpr._Create(this._cp, "reusableFloatExpr", outParams);
    }
    /** @internal */
    _floatIdentity(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return Constraint._Create(this._cp, "floatIdentity", outParams);
    }
    /** @internal */
    _floatGuard(absentValue = 0) {
        let outParams = [this._getArg(), GetFloat(absentValue)];
        return FloatExpr._Create(this._cp, "floatGuard", outParams);
    }
    /** @internal */
    neg() {
        let outParams = [this._getArg()];
        return FloatExpr._Create(this._cp, "floatNeg", outParams);
    }
    /** @internal */
    _floatPlus(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return FloatExpr._Create(this._cp, "floatPlus", outParams);
    }
    /** @internal */
    _floatMinus(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return FloatExpr._Create(this._cp, "floatMinus", outParams);
    }
    /** @internal */
    _floatTimes(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return FloatExpr._Create(this._cp, "floatTimes", outParams);
    }
    /** @internal */
    _floatDiv(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return FloatExpr._Create(this._cp, "floatDiv", outParams);
    }
    /** @internal */
    _floatEq(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return BoolExpr._Create(this._cp, "floatEq", outParams);
    }
    /** @internal */
    _floatNe(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return BoolExpr._Create(this._cp, "floatNe", outParams);
    }
    /** @internal */
    _floatLt(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return BoolExpr._Create(this._cp, "floatLt", outParams);
    }
    /** @internal */
    _floatLe(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return BoolExpr._Create(this._cp, "floatLe", outParams);
    }
    /** @internal */
    _floatGt(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return BoolExpr._Create(this._cp, "floatGt", outParams);
    }
    /** @internal */
    _floatGe(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return BoolExpr._Create(this._cp, "floatGe", outParams);
    }
    /** @internal */
    _floatInRange(lb, ub) {
        let outParams = [this._getArg(), GetFloat(lb), GetFloat(ub)];
        return BoolExpr._Create(this._cp, "floatInRange", outParams);
    }
    /** @internal */
    _floatNotInRange(lb, ub) {
        let outParams = [this._getArg(), GetFloat(lb), GetFloat(ub)];
        return BoolExpr._Create(this._cp, "floatNotInRange", outParams);
    }
    /** @internal */
    abs() {
        let outParams = [this._getArg()];
        return FloatExpr._Create(this._cp, "floatAbs", outParams);
    }
    /** @internal */
    square() {
        let outParams = [this._getArg()];
        return FloatExpr._Create(this._cp, "floatSquare", outParams);
    }
    /** @internal */
    _floatMin2(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return FloatExpr._Create(this._cp, "floatMin2", outParams);
    }
    /** @internal */
    _floatMax2(rhs) {
        let outParams = [this._getArg(), GetFloatExpr(rhs)];
        return FloatExpr._Create(this._cp, "floatMax2", outParams);
    }
}
/**
 * A class representing an integer expression in the model.
 *
 * @remarks
 * The expression may depend on the value of a variable (or variables), so the
 * value of the expression is not known until a solution is found. The value must
 * be in the range {@link IntVarMin} to {@link IntVarMax}.
 *
 * See {@link IntExpr.plus}, {@link IntExpr.minus}, {@link IntExpr.times} for arithmetic,
 * and {@link IntExpr.le}, {@link IntExpr.eq}, etc. for comparisons.
 *
 * @example
 *
 * The following code creates two interval variables `x` and `y`
 * and an integer expression `makespan` that is equal to the maximum of the end
 * times of `x` and `y` (see {@link Model.max2}):
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let y = model.intervalVar({ length: 20, name: "y" });
 * let makespan = model.max2(x.end(), y.end());
 * ```
 *
 * ## Optional integer expressions
 *
 * Underlying variables of an integer expression may be optional, i.e., they may
 * or may not be present in a solution (for example, an optional task
 * can be omitted entirely from the solution). In this case, the value of the
 * integer expression is *absent*. The value *absent* means that the variable
 * has no meaning; it does not exist in the solution.
 *
 * Except {@link IntExpr.guard} expression, any value of an integer
 * expression that depends on an absent variable is also *absent*.
 * As we don't know the value of the expression before the solution is found,
 * we call such expression *optional*.
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
 * let finish = model.end(x);
 * let ready = finish.plus(10);
 * let begin = model.start(y);
 * let precedes = ready.le(begin);
 * model.enforce(precedes);
 * let result = await model.solve();
 * ```
 *
 * In this model:
 *
 * * `finish` is an optional integer expression because it depends on
 *   an optional variable `x`.
 * * The expression `ready` is optional for the same reason.
 * * The expression `begin` is not optional because it depends only on a
 *   non-optional variable `y`.
 * * Boolean expression `precedes` is also optional. Its value could be
 *   `true`, `false` or *absent*.
 *
 * The expression `precedes` is turned into a constraint using
 * {@link Model.enforce}. Therefore, it cannot be `false`
 * in the solution. However, it can still be *absent*. Therefore the constraint
 * `precedes` can be satisfied in two ways:
 *
 * 1. Both `x` and `y` are present, `x` is before `y`, and the delay between them
 * is at least 10. In this case, `precedes` is `true`.
 * 2. `x` is absent and `y` is present. In this case, `precedes` is *absent*.
 *
 * @category Modeling
 */
export class IntExpr extends FloatExpr {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(IntExpr.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
    /**
     * Creates a minimization objective for this expression.
     *
     * @returns An Objective that minimizes this expression.
     *
     * @remarks
     * Creates an objective to minimize the value of this integer expression.
     * A model can have at most one objective. New objective replaces the old one.
     *
     * This is a fluent-style alternative to {@link Model.minimize} that allows
     * creating objectives directly from expressions.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({length: 10, name: "x"});
     * const y = model.intervalVar({length: 20, name: "y"});
     *
     * // Fluent style - minimize the end of y
     * y.end().minimize();
     *
     * // Equivalent Model.minimize() style:
     * model.minimize(y.end());
     * ```
     *
     * @see {@link Model.minimize} for Model-centric minimization.
     * @see {@link IntExpr.maximize} for maximization.
     */
    minimize() {
        return this._cp.minimize(this);
    }
    /**
     * Creates a maximization objective for this expression.
     *
     * @returns An Objective that maximizes this expression.
     *
     * @remarks
     * Creates an objective to maximize the value of this integer expression.
     * A model can have at most one objective. New objective replaces the old one.
     *
     * This is a fluent-style alternative to {@link Model.maximize} that allows
     * creating objectives directly from expressions.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({start: [0, 100], length: 10, name: "x"});
     *
     * // Fluent style - maximize the start of x
     * x.start().maximize();
     *
     * // Equivalent Model.maximize() style:
     * model.maximize(x.start());
     * ```
     *
     * @see {@link Model.maximize} for Model-centric maximization.
     * @see {@link IntExpr.minimize} for minimization.
     */
    maximize() {
        return this._cp.maximize(this);
    }
    /** @internal */
    _reusableIntExpr() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "reusableIntExpr", outParams);
    }
    /**
     * Returns an expression which is `true` if the expression is *present* and `false` when it is *absent*.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * The resulting expression is never *absent*.
     *
     * Same as {@link Model.presence}.
     */
    presence() {
        let outParams = [this._getArg()];
        return BoolExpr._Create(this._cp, "intPresenceOf", outParams);
    }
    /**
     * Creates an expression that replaces value *absent* by a constant.
     *
     * @param absentValue The value to use when the expression is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * The resulting expression is:
     *
     * * equal to the expression if the expression is *present*
     * * and equal to `absentValue` otherwise (i.e. when the expression is *absent*).
     *
     * The default value of `absentValue` is 0.
     *
     * The resulting expression is never *absent*.
     *
     * Same as {@link Model.guard}.
     */
    guard(absentValue = 0) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        return IntExpr._Create(this._cp, "intGuard", outParams);
    }
    /**
     * Returns negation of the expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.neg}.
     */
    neg() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "intNeg", outParams);
    }
    /**
     * Returns addition of the expression and the argument.
     *
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.plus}.
     */
    plus(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "intPlus", outParams);
    }
    /**
     * Returns subtraction of the expression and `arg`.
     *
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.minus}.
     */
    minus(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "intMinus", outParams);
    }
    /**
     * Returns multiplication of the expression and `arg`.
     *
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.times}.
     */
    times(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "intTimes", outParams);
    }
    /**
     * Returns integer division of the expression `arg`. The division rounds towards zero.
     *
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.div}.
     */
    div(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "intDiv", outParams);
    }
    /** @internal */
    _modulo(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "modulo", outParams);
    }
    /**
     * Constrains two expressions to be identical, including their presence status.
     *
     * @param rhs The second integer expression.
     *
     * @returns The constraint object
     *
     * @remarks
     * Identity is different than equality. For example, if `x` is *absent*, then `x == 0` is *absent*, but `x.identity(0)` is `false`.
     *
     * Same as {@link Model.identity}.
     */
    identity(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return Constraint._Create(this._cp, "intIdentity", outParams);
    }
    /**
     * Create an equality constraint.
     *
     * @param rhs The expression or constant to compare against.
     *
     * @returns A boolean expression that is true when self equals `rhs`.
     *
     * @remarks
     * Returns a {@link BoolExpr} representing `self == other`.
     *
     * If either operand has value *absent*, the result is also *absent*.
     *
     * @see {@link IntExpr.ne} for inequality comparison.
     * @see {@link Model.eq} for the Model-centric style.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // IntExpr.eq(IntExpr)
     * model.enforce(x.eq(y));
     *
     * // IntExpr.eq(constant)
     * model.enforce(x.eq(5));
     * ```
     */
    eq(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return BoolExpr._Create(this._cp, "intEq", outParams);
    }
    /**
     * Create an inequality constraint.
     *
     * @param rhs The expression or constant to compare against.
     *
     * @returns A boolean expression that is true when self does not equal `rhs`.
     *
     * @remarks
     * Returns a {@link BoolExpr} representing `self != other`.
     *
     * If either operand has value *absent*, the result is also *absent*.
     *
     * @see {@link IntExpr.eq} for equality comparison.
     * @see {@link Model.ne} for the Model-centric style.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // IntExpr.ne(IntExpr)
     * model.enforce(x.ne(y));
     *
     * // IntExpr.ne(constant)
     * model.enforce(x.ne(5));
     * ```
     */
    ne(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return BoolExpr._Create(this._cp, "intNe", outParams);
    }
    /**
     * Create a less-than constraint.
     *
     * @param rhs The expression or constant to compare against.
     *
     * @returns A boolean expression that is true when self is less than `rhs`.
     *
     * @remarks
     * Returns a {@link BoolExpr} representing `self < other`.
     *
     * If either operand has value *absent*, the result is also *absent*.
     *
     * @see {@link IntExpr.le} for less-than-or-equal comparison.
     * @see {@link IntExpr.gt} for greater-than comparison.
     * @see {@link Model.lt} for the Model-centric style.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // IntExpr.lt(IntExpr)
     * model.enforce(x.lt(y));
     *
     * // IntExpr.lt(constant)
     * model.enforce(x.lt(5));
     * ```
     */
    lt(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return BoolExpr._Create(this._cp, "intLt", outParams);
    }
    /**
     * Create a less-than-or-equal constraint.
     *
     * @param rhs The expression or constant to compare against.
     *
     * @returns A boolean expression that is true when self is less than or equal to `rhs`.
     *
     * @remarks
     * Returns a {@link BoolExpr} representing `self <= other`.
     *
     * If either operand has value *absent*, the result is also *absent*.
     *
     * @see {@link IntExpr.lt} for strict less-than comparison.
     * @see {@link IntExpr.ge} for greater-than-or-equal comparison.
     * @see {@link Model.le} for the Model-centric style.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // IntExpr.le(IntExpr)
     * model.enforce(x.le(y));
     *
     * // IntExpr.le(constant)
     * model.enforce(x.le(5));
     * ```
     */
    le(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return BoolExpr._Create(this._cp, "intLe", outParams);
    }
    /**
     * Create a greater-than constraint.
     *
     * @param rhs The expression or constant to compare against.
     *
     * @returns A boolean expression that is true when self is greater than `rhs`.
     *
     * @remarks
     * Returns a {@link BoolExpr} representing `self > other`.
     *
     * If either operand has value *absent*, the result is also *absent*.
     *
     * @see {@link IntExpr.ge} for greater-than-or-equal comparison.
     * @see {@link IntExpr.lt} for less-than comparison.
     * @see {@link Model.gt} for the Model-centric style.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // IntExpr.gt(IntExpr)
     * model.enforce(x.gt(y));
     *
     * // IntExpr.gt(constant)
     * model.enforce(x.gt(5));
     * ```
     */
    gt(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return BoolExpr._Create(this._cp, "intGt", outParams);
    }
    /**
     * Create a greater-than-or-equal constraint.
     *
     * @param rhs The expression or constant to compare against.
     *
     * @returns A boolean expression that is true when self is greater than or equal to `rhs`.
     *
     * @remarks
     * Returns a {@link BoolExpr} representing `self >= other`.
     *
     * If either operand has value *absent*, the result is also *absent*.
     *
     * @see {@link IntExpr.gt} for strict greater-than comparison.
     * @see {@link IntExpr.le} for less-than-or-equal comparison.
     * @see {@link Model.ge} for the Model-centric style.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // IntExpr.ge(IntExpr)
     * model.enforce(x.ge(y));
     *
     * // IntExpr.ge(constant)
     * model.enforce(x.ge(5));
     * ```
     */
    ge(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return BoolExpr._Create(this._cp, "intGe", outParams);
    }
    /**
     * Creates Boolean expression `lb` ≤ `this` ≤ `ub`.
     *
     * @param lb The lower bound of the range.
     * @param ub The upper bound of the range.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the expression has value *absent*, then the resulting expression has also value *absent*.
     *
     * Use {@link Model.enforce} to add this expression as a constraint to the model.
     *
     * Same as {@link Model.inRange}.
     */
    inRange(lb, ub) {
        let outParams = [this._getArg(), GetInt(lb), GetInt(ub)];
        return BoolExpr._Create(this._cp, "intInRange", outParams);
    }
    /** @internal */
    _notInRange(lb, ub) {
        let outParams = [this._getArg(), GetInt(lb), GetInt(ub)];
        return BoolExpr._Create(this._cp, "intNotInRange", outParams);
    }
    /**
     * Creates an integer expression which is absolute value of the expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression has value *absent*, the resulting expression also has value *absent*.
     *
     * Same as {@link Model.abs}.
     */
    abs() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "intAbs", outParams);
    }
    /**
     * Creates an integer expression which is the minimum of the expression and `arg`.
     *
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.min2}. See {@link Model.min} for the n-ary minimum.
     */
    min2(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "intMin2", outParams);
    }
    /**
     * Creates an integer expression which is the maximum of the expression and `arg`.
     *
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.max2}. See {@link Model.max} for n-ary maximum.
     */
    max2(rhs) {
        let outParams = [this._getArg(), GetIntExpr(rhs)];
        return IntExpr._Create(this._cp, "intMax2", outParams);
    }
    /** @internal */
    square() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "intSquare", outParams);
    }
}
/**
 * @remarks
 * A class that represents a boolean expression in the model.
 * The expression may depend on one or more variables; therefore, its value
 * may be unknown until a solution is found.
 *
 * @example
 *
 * For example, the following code creates two interval variables, `x` and `y`
 * and a boolean expression `precedes` that is true if `x` ends before `y` starts,
 * that is, if the end of `x` is less than or equal to
 * the start of `y`:
 *
 * See {@link IntExpr.le} for the comparison method.
 * ```ts
 * let model = new CP.Model();
 * let x = model.intervalVar({ length: 10, name: "x" });
 * let y = model.intervalVar({ length: 20, name: "y" });
 * let precedes = x.end().le(y.start());
 * let result = await model.solve();
 * ```
 *
 * Boolean expressions can be used to create constraints using {@link Model.enforce}. In the example above, we may require that `precedes` is
 * true or *absent*:
 * ```ts
 * model.enforce(precedes);
 * ```
 *
 * ### Optional boolean expressions
 *
 * _OptalCP_ is using 3-value logic: a boolean expression can be `true`, `false`
 * or *absent*. Typically, the expression is *absent* only if one or
 * more underlying variables are *absent*.  The value *absent*
 * means that the expression doesn't have a meaning because one or more
 * underlying variables are absent (not part of the solution).
 *
 * ### Difference between constraints and boolean expressions
 *
 * Boolean expressions can take arbitrary value (`true`, `false`, or *absent*)
 * and can be combined into composed expressions (e.g., using {@link BoolExpr.and} or
 * {@link BoolExpr.or}).
 *
 * Constraints can only be `true` or *absent* (in a solution) and cannot
 * be combined into composed expressions.
 *
 * Some functions create constraints directly, e.g. {@link Model.noOverlap}.
 * It is not possible to combine constraints using logical operators like `or`.
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
 * let precedes = a.end().le(b.start());
 * model.enforce(precedes);
 * let result = await model.solve();
 * ```
 *
 * Adding a boolean expression as a constraint requires that the expression
 * cannot be `false` in a solution. It could be *absent* though.
 * Therefore, in our example, there are four kinds of solutions:
 *
 * 1. Both `a` and `b` are present, and `a` ends before `b` starts.
 * 2. Only `a` is present, and `b` is absent.
 * 3. Only `b` is present, and `a` is absent.
 * 4. Both `a` and `b` are absent.
 *
 * In case 1, the expression `precedes` is `true`. In all the other cases
 * `precedes` is *absent* as at least one of the variables `a` and `b` is
 * absent, and then `precedes` doesn't have a meaning.
 *
 * ### Boolean expressions as integer expressions
 *
 * Class `BoolExpr` derives from {@link IntExpr}. Therefore, boolean expressions can be used
 * as integer expressions. In this case, `true` is equal to `1`, `false` is
 * equal to `0`, and *absent* remains *absent*.
 *
 * @category Modeling
 */
export class BoolExpr extends IntExpr {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(BoolExpr.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
    /**
     * Adds this boolean expression as a constraint to the model.
     *
     * @remarks
     * This method adds the boolean expression as a constraint to the model. It provides
     * a fluent-style alternative to {@link Model.enforce}.
     *
     * A constraint is satisfied if it is not `false`. In other words, a constraint is
     * satisfied if it is `true` or *absent*.
     *
     * A boolean expression that is *not* added as a constraint can have
     * arbitrary value in a solution (`true`, `false`, or *absent*). Once added
     * as a constraint, it can only be `true` or *absent* in the solution.
     *
     * @see {@link Model.enforce} for the Model-centric style of adding constraints.
     * @see {@link BoolExpr} for more about boolean expressions.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, name: "y" });
     *
     * // Enforce constraint using fluent style
     * x.plus(y).le(15).enforce();
     *
     * // Equivalent to:
     * // model.enforce(x.plus(y).le(15));
     *
     * const result = await model.solve();
     * ```
     */
    enforce() {
        this._cp.enforce(this);
    }
    /** @internal */
    _reusableBoolExpr() {
        let outParams = [this._getArg()];
        return BoolExpr._Create(this._cp, "reusableBoolExpr", outParams);
    }
    /**
     * Returns negation of the expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the expression has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.not}.
     */
    not() {
        let outParams = [this._getArg()];
        return BoolExpr._Create(this._cp, "boolNot", outParams);
    }
    /**
     * Returns logical _OR_ of the expression and `arg`.
     *
     * @param rhs The second boolean expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the expression or `arg` has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.or}.
     */
    or(rhs) {
        let outParams = [this._getArg(), GetBoolExpr(rhs)];
        return BoolExpr._Create(this._cp, "boolOr", outParams);
    }
    /**
     * Returns logical _AND_ of the expression and `arg`.
     *
     * @param rhs The second boolean expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.and}.
     */
    and(rhs) {
        let outParams = [this._getArg(), GetBoolExpr(rhs)];
        return BoolExpr._Create(this._cp, "boolAnd", outParams);
    }
    /**
     * Returns implication between the expression and `arg`.
     *
     * @param rhs The second boolean expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the expression or `arg` has value *absent*, then the resulting expression has also value *absent*.
     *
     * Same as {@link Model.implies}.
     */
    implies(rhs) {
        let outParams = [this._getArg(), GetBoolExpr(rhs)];
        return BoolExpr._Create(this._cp, "boolImplies", outParams);
    }
    /** @internal */
    _eq(rhs) {
        let outParams = [this._getArg(), GetBoolExpr(rhs)];
        return BoolExpr._Create(this._cp, "boolEq", outParams);
    }
    /** @internal */
    _ne(rhs) {
        let outParams = [this._getArg(), GetBoolExpr(rhs)];
        return BoolExpr._Create(this._cp, "boolNe", outParams);
    }
    /** @internal */
    _nand(rhs) {
        let outParams = [this._getArg(), GetBoolExpr(rhs)];
        return BoolExpr._Create(this._cp, "boolNand", outParams);
    }
}
/**
 * Represents an optimization objective in the model.
 *
 * @remarks
 * An objective specifies what value should be minimized or maximized when solving the model. Objectives are created by calling {@link Model.minimize} or {@link Model.maximize}, or by using the fluent methods {@link IntExpr.minimize} or {@link IntExpr.maximize}.
 *
 * A model can have at most one objective.
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * const x = model.intervalVar({length: 10, name: "x"});
 * const y = model.intervalVar({length: 20, name: "y"});
 *
 * // Create objective using Model.minimize() - automatically registered:
 * model.minimize(y.end());
 *
 * // Or using fluent style on expressions - automatically registered:
 * y.end().minimize();
 * ```
 *
 * @see {@link Model.minimize} for creating minimization objectives.
 * @see {@link Model.maximize} for creating maximization objectives.
 * @see {@link IntExpr.minimize} for fluent-style minimization.
 * @see {@link IntExpr.maximize} for fluent-style maximization.
 *
 * @category Modeling
 */
export class Objective extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(Objective.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
}
/**
 * @remarks
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
 * Functions {@link Model.presence} and {@link IntExpr.presence} can constrain the presence of the variable.
 *
 * Integer variables can be created using the function {@link Model.intVar}.
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
 * @category Modeling
 */
export class IntVar extends IntExpr {
    // TODO:3 Int var must support ranges and enumerated domain.
    /** @internal */
    static _Create(cp) {
        const instance = Object.create(IntVar.prototype);
        instance._cp = cp;
        instance._props = {
            func: "intVar",
            args: [],
            min: undefined,
            max: undefined,
            status: undefined,
            name: undefined
        };
        instance._arg = { arg: undefined, ref: cp._getNewRefId(instance._props) };
        return instance;
    }
    /** @internal */
    static _CreateFromJSON(cp, props, id) {
        const instance = Object.create(IntVar.prototype);
        instance._cp = cp;
        instance._props = props;
        instance._arg = { arg: undefined, ref: id };
        return instance;
    }
    // @internal Optimized version (ref is always set):
    _getArg() { return this._arg; }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_intVar"; }
    /**
     * The presence status of the integer variable.
     *
     * @remarks
     * Gets or sets the presence status of the integer variable using a tri-state value:
     *
     * - `True` / `true`: The variable is *optional* - the solver decides whether it is present or absent in the solution.
     * - `False` / `false`: The variable is *present* - it must have a value in the solution.
     * - `None` / `null`: The variable is *absent* - it will be omitted from the solution.
     *
     * **Note:** This property reflects the presence status in the model
     * (before the solve), not in the solution.
     *
     * @see {@link IntVar.min}, {@link IntVar.max}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 0, max: 10, name: "x" });
     * const y = model.intVar({ min: 0, max: 10, optional: true, name: "y" });
     *
     * console.log(x.optional);  // false (present by default)
     * console.log(y.optional);  // true (optional)
     *
     * // Make x optional
     * x.optional = true;
     * console.log(x.optional);  // true
     *
     * // Make y absent
     * y.optional = null;
     * console.log(y.optional);  // null
     * ```
     */
    get optional() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        if (this._props.status === 0 /* PresenceStatus.Optional */)
            return true;
        return false;
    }
    set optional(value) {
        if (value === null)
            this._props.status = 2 /* PresenceStatus.Absent */;
        else if (value)
            this._props.status = 0 /* PresenceStatus.Optional */;
        else
            this._props.status = undefined;
    }
    /**
     * The minimum value of the integer variable's domain.
     *
     * @remarks
     * Gets or sets the minimum value of the integer variable's domain.
     *
     * The initial value is set during construction by {@link Model.intVar}.
     * If the variable is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the variable's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range {@link IntVarMin} to {@link IntVarMax}.
     *
     * @see {@link IntVar.max}, {@link IntVar.optional}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 5, max: 10, name: "x" });
     *
     * console.log(x.min);  // 5
     *
     * x.min = 7;
     * console.log(x.min);  // 7
     * ```
     */
    get min() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.min ?? 0;
    }
    set min(value) { this._props.min = GetInt(value); }
    /**
     * The maximum value of the integer variable's domain.
     *
     * @remarks
     * Gets or sets the maximum value of the integer variable's domain.
     *
     * The initial value is set during construction by {@link Model.intVar}.
     * If the variable is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the variable's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range {@link IntVarMin} to {@link IntVarMax}.
     *
     * @see {@link IntVar.min}, {@link IntVar.optional}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar({ min: 5, max: 10, name: "x" });
     *
     * console.log(x.max);  // 10
     *
     * x.max = 8;
     * console.log(x.max);  // 8
     * ```
     */
    get max() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.max ?? IntVarMax;
    }
    set max(value) { this._props.max = GetInt(value); }
    /** @internal @deprecated Use `optional` property instead */
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    /** @internal @deprecated Use `optional` property instead */
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `min` property instead */
    getMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.min ?? 0;
    }
    /** @internal @deprecated Use `max` property instead */
    getMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.max ?? IntVarMax;
    }
    /** @internal @deprecated Use `optional` property instead */
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `optional` property instead */
    makePresent() { this._props.status = undefined; }
    /** @internal @deprecated Use `min` property instead */
    setMin(min) { this._props.min = GetInt(min); }
    /** @internal @deprecated Use `max` property instead */
    setMax(max) { this._props.max = GetInt(max); }
    /** @internal @deprecated Use `min` and `max` properties instead */
    setRange(min, max) {
        this._props.min = GetInt(min);
        this._props.max = GetInt(max);
    }
}
/** @internal */
export class FloatVar extends FloatExpr {
    // TODO:3 Float var must support ranges and enumerated domain.
    /** @internal */
    static _Create(cp) {
        const instance = Object.create(FloatVar.prototype);
        instance._cp = cp;
        instance._props = {
            func: "floatVar",
            args: [],
            min: undefined,
            max: undefined,
            status: undefined,
            name: undefined
        };
        instance._arg = { arg: undefined, ref: cp._getNewRefId(instance._props) };
        return instance;
    }
    /** @internal */
    static _CreateFromJSON(cp, props, id) {
        const instance = Object.create(FloatVar.prototype);
        instance._cp = cp;
        instance._props = props;
        instance._arg = { arg: undefined, ref: id };
        return instance;
    }
    // @internal Optimized version (ref is always set):
    _getArg() { return this._arg; }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_floatVar"; }
    get optional() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        if (this._props.status === 0 /* PresenceStatus.Optional */)
            return true;
        return false;
    }
    set optional(value) {
        if (value === null)
            this._props.status = 2 /* PresenceStatus.Absent */;
        else if (value)
            this._props.status = 0 /* PresenceStatus.Optional */;
        else
            this._props.status = undefined;
    }
    get min() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.min ?? FloatVarMin;
    }
    set min(value) { this._props.min = GetFloat(value); }
    get max() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.max ?? FloatVarMax;
    }
    set max(value) { this._props.max = GetFloat(value); }
    /** @internal @deprecated Use `optional` property instead */
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    /** @internal @deprecated Use `optional` property instead */
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `min` property instead */
    getMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.min ?? FloatVarMin;
    }
    /** @internal @deprecated Use `max` property instead */
    getMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.max ?? FloatVarMax;
    }
    /** @internal @deprecated Use `optional` property instead */
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `optional` property instead */
    makePresent() { this._props.status = undefined; }
    /** @internal @deprecated Use `min` property instead */
    setMin(min) { this._props.min = GetFloat(min); }
    /** @internal @deprecated Use `max` property instead */
    setMax(max) { this._props.max = GetFloat(max); }
    /** @internal @deprecated Use `min` and `max` properties instead */
    setRange(min, max) {
        this._props.min = GetFloat(min);
        this._props.max = GetFloat(max);
    }
}
/**
 * @remarks
 * Boolean variable represents an unknown truth value (`True` or `False`) that the solver must find.
 *
 * Boolean variables are useful for modeling decisions, choices, or logical conditions in your problem. For example, you can use boolean variables to represent whether a machine is used, whether a task is assigned to a particular worker, or whether a constraint should be enforced.
 *
 * Boolean variables can be created using the function {@link Model.boolVar}.
 * By default, boolean variables are *present* (not optional).
 * To create an optional boolean variable, specify `optional=True` in the arguments of the function.
 *
 * ### Logical operators
 *
 * Boolean variables support the following logical operators:
 *
 * - {@link BoolExpr.not} for logical NOT
 * - {@link BoolExpr.or} for logical OR
 * - {@link BoolExpr.and} for logical AND
 *
 * These operators can be used to create complex boolean expressions and constraints.
 *
 * ### Boolean variables as integer expressions
 *
 * Class `BoolVar` derives from {@link BoolExpr}, which derives from {@link IntExpr}.
 * Therefore, boolean variables can be used as integer expressions:
 * *True* is equal to *1*, *False* is equal to *0*, and *absent* remains *absent*.
 *
 * This is useful for counting how many conditions are satisfied or for weighted sums.
 *
 * ### Optional boolean variables
 *
 * A boolean variable can be optional. In this case, the solver can decide to make the variable *absent*, which means the variable doesn't participate in the solution. When a boolean variable is absent, its value is neither `True` nor `False` — it is *absent*.
 *
 * Most expressions that depend on an absent variable are also *absent*. For example, if `x` is an absent boolean variable, then `~x`, `x | y`, and `x & y` are all *absent*, regardless of the value of `y`. However, some functions handle absent values specially, such as {@link IntExpr.presence} or {@link Model.sum}.
 *
 * When a boolean expression is added as a constraint using {@link Model.enforce}, the constraint requires that the expression is not `false` in the solution. The expression can be `true` or *absent*. This means that constraints involving optional variables are automatically satisfied when the underlying variables are absent.
 *
 * Functions {@link Model.presence} and {@link IntExpr.presence} can constrain the presence of the variable.
 *
 * @see {@link Model.boolVar} to create boolean variables.
 * @see {@link BoolExpr} for boolean expressions and their operations.
 * @see {@link IntVar} for integer decision variables.
 * @see {@link IntervalVar} for the primary variable type for scheduling problems.
 *
 * @example
 *
 * In the following example, we create two boolean variables representing whether to use each of two machines. We require that at least one machine is used, but not both:
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * const useMachineA = model.boolVar({ name: "use_machine_a" });
 * const useMachineB = model.boolVar({ name: "use_machine_b" });
 *
 * // Constraint: must use at least one machine
 * model.enforce(useMachineA.or(useMachineB));
 *
 * // Constraint: cannot use both machines (exclusive choice)
 * model.enforce(useMachineA.and(useMachineB).not());
 *
 * const result = await model.solve();
 * ```
 *
 * @example
 *
 * Boolean variables can be used in arithmetic expressions by treating `True` as 1 and `False` as 0:
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * const options = Array.from({length: 5}, (_, i) => model.boolVar({ name: `option_${i}` }));
 *
 * // Constraint: select exactly 2 options
 * model.enforce(model.sum(options).eq(2));
 *
 * const result = await model.solve();
 * ```
 *
 * @category Modeling
 */
export class BoolVar extends BoolExpr {
    /** @internal */
    static _Create(cp) {
        const instance = Object.create(BoolVar.prototype);
        instance._cp = cp;
        instance._props = {
            func: "boolVar",
            args: [],
            min: undefined,
            max: undefined,
            status: undefined,
            name: undefined
        };
        instance._arg = { arg: undefined, ref: cp._getNewRefId(instance._props) };
        return instance;
    }
    /** @internal */
    static _CreateFromJSON(cp, props, id) {
        const instance = Object.create(BoolVar.prototype);
        instance._cp = cp;
        instance._props = props;
        instance._arg = { arg: undefined, ref: id };
        return instance;
    }
    // @internal Optimized version (ref is always set):
    _getArg() { return this._arg; }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_boolVar"; }
    /**
     * The presence status of the boolean variable.
     *
     * @remarks
     * Gets or sets the presence status of the boolean variable using a tri-state value:
     *
     * - `True` / `true`: The variable is *optional* - the solver decides whether it is present or absent in the solution.
     * - `False` / `false`: The variable is *present* - it must have a value in the solution.
     * - `None` / `null`: The variable is *absent* - it will be omitted from the solution.
     *
     * **Note:** This property reflects the presence status in the model
     * (before the solve), not in the solution.
     *
     * @see {@link BoolVar.min}, {@link BoolVar.max}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.boolVar({ name: "x" });
     * const y = model.boolVar({ optional: true, name: "y" });
     *
     * console.log(x.optional);  // false (present by default)
     * console.log(y.optional);  // true (optional)
     *
     * // Make x optional
     * x.optional = true;
     * console.log(x.optional);  // true
     *
     * // Make y absent
     * y.optional = null;
     * console.log(y.optional);  // null
     * ```
     */
    get optional() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        if (this._props.status === 0 /* PresenceStatus.Optional */)
            return true;
        return false;
    }
    set optional(value) {
        if (value === null)
            this._props.status = 2 /* PresenceStatus.Absent */;
        else if (value)
            this._props.status = 0 /* PresenceStatus.Optional */;
        else
            this._props.status = undefined;
    }
    /**
     * The minimum value of the boolean variable's domain.
     *
     * @remarks
     * Gets or sets the minimum value of the boolean variable's domain.
     *
     * For a free (unconstrained) boolean variable, returns `False`.
     * If set to `True`, the variable is fixed to `True`.
     * If the variable is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the variable's domain in the model
     * (before the solve), not in the solution.
     *
     * @see {@link BoolVar.max}, {@link BoolVar.optional}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.boolVar({ name: "x" });
     *
     * console.log(x.min);  // false (default minimum)
     *
     * x.min = true;
     * console.log(x.min);  // true (variable is now fixed to true)
     * ```
     */
    get min() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.min ?? false;
    }
    set min(value) { this._props.min = value; }
    /**
     * The maximum value of the boolean variable's domain.
     *
     * @remarks
     * Gets or sets the maximum value of the boolean variable's domain.
     *
     * For a free (unconstrained) boolean variable, returns `True`.
     * If set to `False`, the variable is fixed to `False`.
     * If the variable is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the variable's domain in the model
     * (before the solve), not in the solution.
     *
     * @see {@link BoolVar.min}, {@link BoolVar.optional}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.boolVar({ name: "x" });
     *
     * console.log(x.max);  // true (default maximum)
     *
     * x.max = false;
     * console.log(x.max);  // false (variable is now fixed to false)
     * ```
     */
    get max() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.max ?? true;
    }
    set max(value) { this._props.max = value; }
    /** @internal @deprecated Use `optional` property instead */
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    /** @internal @deprecated Use `optional` property instead */
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `min` property instead */
    getMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.min ?? false;
    }
    /** @internal @deprecated Use `max` property instead */
    getMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.max ?? true;
    }
    /** @internal @deprecated Use `optional` property instead */
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `optional` property instead */
    makePresent() { this._props.status = undefined; }
    /** @internal @deprecated Use `min` property instead */
    setMin(min) { this._props.min = min; }
    /** @internal @deprecated Use `max` property instead */
    setMax(max) { this._props.max = max; }
    /** @internal @deprecated Use `min` and `max` properties instead */
    setRange(minVal, maxVal) {
        this._props.min = minVal;
        this._props.max = maxVal;
    }
}
/**
 * @remarks
 * Interval variable is a task, action, operation, or any other interval with a start
 * and an end. The start and the end of the interval are unknowns that the solver
 * has to find. They could be accessed as integer expressions using
 * {@link IntervalVar.start} and {@link IntervalVar.end}.
 * or using {@link Model.start} and {@link Model.end}.
 * In addition to the start and the end of the interval, the interval variable
 * has a length (equal to _end - start_) that can be accessed using
 * {@link IntervalVar.length} or {@link Model.length}.
 *
 * The interval variable can be optional. In this case, the solver can decide
 * to make the interval absent, which is usually interpreted as the fact that
 * the interval doesn't exist, the task/action was not executed, or the operation
 * was not performed.  When the interval variable is absent, its start, end,
 * and length are also absent.  A boolean expression that represents the presence
 * of the interval variable can be accessed using
 * {@link IntervalVar.presence} and {@link Model.presence}.
 *
 * Interval variables can be created using the function
 * {@link Model.intervalVar}.
 * By default, interval variables are *present* (not optional).
 * To create an optional interval, specify `optional: true` in the
 * arguments of the function.
 *
 * @example
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
 * let result = await model.solve();
 * ```
 *
 * @example
 *
 * In the following example, there is a task _X_ that could be performed by two
 * different workers _A_ and _B_.  The interval variable `X` represents the task.
 * It is not optional because the task `X` is mandatory. Interval variable
 * `XA` represents the task `X` when performed by worker _A_ and
 * similarly `XB` represents the task `X` when performed by worker _B_.
 * Both `XA` and `XB` are optional because it is not known beforehand which
 * worker will perform the task.  The constraint {@link IntervalVar.alternative} links
 * `X`, `XA` and `XB` together and ensures that only one of `XA` and `XB` is present and that
 * `X` and the present interval are equal.
 *
 * ```ts
 * let model = new CP.Model;
 * let X = model.intervalVar({ length: 10, name: "X" });
 * let XA = model.intervalVar({ name: "XA", optional: true });
 * let XB = model.intervalVar({ name: "XB", optional: true });
 * model.alternative(X, [XA, XB]);
 * let result = await model.solve();
 * ```
 *
 * Variables `XA` and `XB` can be used elsewhere in the model, e.g. to make sure
 * that each worker is assigned to at most one task at a time:
 * ```ts
 * // Tasks of worker A don't overlap:
 * model.noOverlap([... , XA, ...]);
 * // Tasks of worker B don't overlap:
 * model.noOverlap([... , XB, ...]);
 * ```
 *
 * @category Modeling
 */
export class IntervalVar extends ModelElement {
    /** @internal */
    static _Create(cp) {
        const instance = Object.create(IntervalVar.prototype);
        instance._cp = cp;
        instance._props = {
            func: "intervalVar",
            args: [],
            startMin: undefined,
            startMax: undefined,
            endMin: undefined,
            endMax: undefined,
            lengthMin: undefined,
            lengthMax: undefined,
            status: undefined,
            name: undefined
        };
        instance._arg = { arg: undefined, ref: cp._getNewRefId(instance._props) };
        return instance;
    }
    /** @internal */
    static _CreateFromJSON(cp, props, id) {
        const instance = Object.create(IntervalVar.prototype);
        instance._cp = cp;
        instance._props = props;
        instance._arg = { arg: undefined, ref: id };
        return instance;
    }
    // @internal Optimized version (ref is always set):
    _getArg() { return this._arg; }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_intervalVar"; }
    /**
     * The presence status of the interval variable.
     *
     * @remarks
     * Gets or sets the presence status of the interval variable using a tri-state value:
     *
     * - `True` / `true`: The interval is *optional* - the solver decides whether it is present or absent in the solution.
     * - `False` / `false`: The interval is *present* - it must be scheduled in the solution.
     * - `None` / `null`: The interval is *absent* - it will be omitted from the solution (and everything that depends on it).
     *
     * **Note:** This property reflects the presence status in the model
     * (before the solve), not in the solution.
     *
     * @see {@link IntervalVar.startMin}, {@link IntervalVar.endMin}, {@link IntervalVar.lengthMin}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task1 = model.intervalVar({ length: 10, name: "task1" });
     * const task2 = model.intervalVar({ length: 10, optional: true, name: "task2" });
     *
     * console.log(task1.optional);  // false (present by default)
     * console.log(task2.optional);  // true (optional)
     *
     * // Make task1 optional
     * task1.optional = true;
     * console.log(task1.optional);  // true
     *
     * // Make task2 absent
     * task2.optional = null;
     * console.log(task2.optional);  // null
     * ```
     */
    get optional() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        if (this._props.status === 0 /* PresenceStatus.Optional */)
            return true;
        return false;
    }
    set optional(value) {
        if (value === null)
            this._props.status = 2 /* PresenceStatus.Absent */;
        else if (value)
            this._props.status = 0 /* PresenceStatus.Optional */;
        else
            this._props.status = undefined;
    }
    /**
     * The minimum start time of the interval variable.
     *
     * @remarks
     * Gets or sets the minimum start time of the interval variable.
     *
     * The initial value is set during construction by {@link Model.intervalVar}.
     * If the interval is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the interval's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link IntervalVar.startMax}, {@link IntervalVar.endMin}, {@link IntervalVar.lengthMin}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task = model.intervalVar({ length: 10, name: "task" });
     *
     * console.log(task.startMin);  // 0 (default)
     *
     * task.startMin = 5;
     * console.log(task.startMin);  // 5
     * ```
     */
    get startMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.startMin ?? 0;
    }
    set startMin(value) { this._props.startMin = GetInt(value); }
    /**
     * The maximum start time of the interval variable.
     *
     * @remarks
     * Gets or sets the maximum start time of the interval variable.
     *
     * The initial value is set during construction by {@link Model.intervalVar}.
     * If the interval is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the interval's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link IntervalVar.startMin}, {@link IntervalVar.endMax}, {@link IntervalVar.lengthMax}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task = model.intervalVar({ length: 10, name: "task" });
     *
     * task.startMax = 100;
     * console.log(task.startMax);  // 100
     * ```
     */
    get startMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.startMax ?? IntervalMax;
    }
    set startMax(value) { this._props.startMax = GetInt(value); }
    /**
     * The minimum end time of the interval variable.
     *
     * @remarks
     * Gets or sets the minimum end time of the interval variable.
     *
     * The initial value is set during construction by {@link Model.intervalVar}.
     * If the interval is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the interval's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link IntervalVar.endMax}, {@link IntervalVar.startMin}, {@link IntervalVar.lengthMin}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task = model.intervalVar({ length: 10, name: "task" });
     *
     * console.log(task.endMin);  // 10 (startMin + length)
     *
     * task.endMin = 20;
     * console.log(task.endMin);  // 20
     * ```
     */
    get endMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.endMin ?? 0;
    }
    set endMin(value) { this._props.endMin = GetInt(value); }
    /**
     * The maximum end time of the interval variable.
     *
     * @remarks
     * Gets or sets the maximum end time of the interval variable.
     *
     * The initial value is set during construction by {@link Model.intervalVar}.
     * If the interval is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the interval's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link IntervalVar.endMin}, {@link IntervalVar.startMax}, {@link IntervalVar.lengthMax}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task = model.intervalVar({ length: 10, name: "task" });
     *
     * task.endMax = 100;
     * console.log(task.endMax);  // 100
     * ```
     */
    get endMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.endMax ?? IntervalMax;
    }
    set endMax(value) { this._props.endMax = GetInt(value); }
    /**
     * The minimum length of the interval variable.
     *
     * @remarks
     * Gets or sets the minimum length of the interval variable.
     *
     * The initial value is set during construction by {@link Model.intervalVar}.
     * If the interval is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the interval's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range 0 to {@link LengthMax}.
     *
     * @see {@link IntervalVar.lengthMax}, {@link IntervalVar.startMin}, {@link IntervalVar.endMin}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task = model.intervalVar({ length: 10, name: "task" });
     *
     * console.log(task.lengthMin);  // 10
     *
     * task.lengthMin = 5;
     * console.log(task.lengthMin);  // 5
     * ```
     */
    get lengthMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.lengthMin ?? 0;
    }
    set lengthMin(value) { this._props.lengthMin = GetInt(value); }
    /**
     * The maximum length of the interval variable.
     *
     * @remarks
     * Gets or sets the maximum length of the interval variable.
     *
     * The initial value is set during construction by {@link Model.intervalVar}.
     * If the interval is absent, the getter returns `None`.
     *
     * **Note:** This property reflects the interval's domain in the model
     * (before the solve), not in the solution.
     *
     * The value must be in the range 0 to {@link LengthMax}.
     *
     * @see {@link IntervalVar.lengthMin}, {@link IntervalVar.startMax}, {@link IntervalVar.endMax}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task = model.intervalVar({ length: 10, name: "task" });
     *
     * console.log(task.lengthMax);  // 10
     *
     * task.lengthMax = 20;
     * console.log(task.lengthMax);  // 20
     * ```
     */
    get lengthMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.lengthMax ?? LengthMax;
    }
    set lengthMax(value) { this._props.lengthMax = GetInt(value); }
    /** @internal @deprecated Use `optional` property instead */
    isOptional() { return this._props.status === 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    isPresent() { return this._props.status === undefined || this._props.status === 1 /* PresenceStatus.Present */; }
    /** @internal @deprecated Use `optional` property instead */
    isAbsent() { return this._props.status === 2 /* PresenceStatus.Absent */; }
    /** @internal @deprecated Use `startMin` property instead */
    getStartMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.startMin ?? 0;
    }
    /** @internal @deprecated Use `startMax` property instead */
    getStartMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.startMax ?? IntervalMax;
    }
    /** @internal @deprecated Use `endMin` property instead */
    getEndMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.endMin ?? 0;
    }
    /** @internal @deprecated Use `endMax` property instead */
    getEndMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.endMax ?? IntervalMax;
    }
    /** @internal @deprecated Use `lengthMin` property instead */
    getLengthMin() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.lengthMin ?? 0;
    }
    /** @internal @deprecated Use `lengthMax` property instead */
    getLengthMax() {
        if (this._props.status === 2 /* PresenceStatus.Absent */)
            return null;
        return this._props.lengthMax ?? LengthMax;
    }
    /** @internal @deprecated Use `optional` property instead */
    makeOptional() { this._props.status = 0 /* PresenceStatus.Optional */; }
    /** @internal @deprecated Use `optional` property instead */
    makePresent() { this._props.status = undefined; }
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent() { this._props.status = 2 /* PresenceStatus.Absent */; }
    setStart(sMin, sMax) {
        this._props.startMin = GetInt(sMin);
        if (sMax === undefined)
            this._props.startMax = sMin;
        else
            this._props.startMax = GetInt(sMax);
    }
    /** @internal @deprecated Use `startMin` property instead */
    setStartMin(sMin) { this._props.startMin = GetInt(sMin); }
    /** @internal @deprecated Use `startMax` property instead */
    setStartMax(sMax) { this._props.startMax = GetInt(sMax); }
    setEnd(eMin, eMax) {
        this._props.endMin = GetInt(eMin);
        if (eMax === undefined)
            this._props.endMax = eMin;
        else
            this._props.endMax = GetInt(eMax);
    }
    /** @internal @deprecated Use `endMin` property instead */
    setEndMin(eMin) { this._props.endMin = GetInt(eMin); }
    /** @internal @deprecated Use `endMax` property instead */
    setEndMax(eMax) { this._props.endMax = GetInt(eMax); }
    setLength(lMin, lMax) {
        this._props.lengthMin = GetInt(lMin);
        if (lMax === undefined)
            this._props.lengthMax = lMin;
        else
            this._props.lengthMax = GetInt(lMax);
    }
    /** @internal @deprecated Use `lengthMin` property instead */
    setLengthMin(lMin) { this._props.lengthMin = GetInt(lMin); }
    /** @internal @deprecated Use `lengthMax` property instead */
    setLengthMax(lMax) { this._props.lengthMax = GetInt(lMax); }
    /**
     * Creates a Boolean expression which is true if the interval variable is present.
     *
     * @returns A Boolean expression that is true if the interval variable is present in the solution.
     *
     * @remarks
     * The resulting expression is never *absent*: it is `true` if the interval variable is *present* and `false` if the interval variable is *absent*.
     *
     * This function is the same as {@link Model.presence}, see its documentation for more details.
     *
     * @example
     *
     * In the following example, interval variables `x` and `y` must have the same presence status.
     * I.e. they must either be both *present* or both *absent*.
     *
     * ```ts
     * const model = new CP.Model();
     * const x = model.intervalVar({ name: "x", optional: true, length: 10 });
     * const y = model.intervalVar({ name: "y", optional: true, length: 10 });
     * model.enforce(x.presence().eq(y.presence()));
     * ```
     *
     * @see {@link Model.presence} is the equivalent function on {@link Model}.
     */
    presence() {
        let outParams = [this._getArg()];
        return BoolExpr._Create(this._cp, "intervalPresenceOf", outParams);
    }
    /**
     * Creates an integer expression for the start time of the interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the interval variable is absent, then the resulting expression is also absent.
     *
     * @example
     *
     * In the following example, we constrain interval variable `y` to start after the end of `x` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ name: "x", ... });
     * let y = model.intervalVar({ name: "y", ... });
     * model.enforce(x.end().plus(10).le(y.start()));
     * model.enforce(x.length().le(y.length()));
     * ```
     *
     * When `x` or `y` is *absent* then value of both constraints above is *absent* and therefore they are satisfied.
     *
     * @see {@link Model.start} is equivalent function on {@link Model}.
     */
    start() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "startOf", outParams);
    }
    /**
     * Creates an integer expression for the end time of the interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the interval variable is absent, then the resulting expression is also absent.
     *
     * @example
     *
     * In the following example, we constrain interval variable `y` to start after the end of `x` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ name: "x", ... });
     * let y = model.intervalVar({ name: "y", ... });
     * model.enforce(x.end().plus(10).le(y.start()));
     * model.enforce(x.length().le(y.length()));
     * ```
     *
     * When `x` or `y` is *absent* then value of both constraints above is *absent* and therefore they are satisfied.
     *
     * @see {@link Model.end} is equivalent function on {@link Model}.
     */
    end() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "endOf", outParams);
    }
    /**
     * Creates an integer expression for the duration (end - start) of the interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the interval variable is absent, then the resulting expression is also absent.
     *
     * @example
     *
     * In the following example, we constrain interval variable `y` to start after the end of `x` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ name: "x", ... });
     * let y = model.intervalVar({ name: "y", ... });
     * model.enforce(x.end().plus(10).le(y.start()));
     * model.enforce(x.length().le(y.length()));
     * ```
     *
     * When `x` or `y` is *absent* then value of both constraints above is *absent* and therefore they are satisfied.
     *
     * @see {@link Model.length} is equivalent function on {@link Model}.
     */
    length() {
        let outParams = [this._getArg()];
        return IntExpr._Create(this._cp, "lengthOf", outParams);
    }
    /**
     * Creates an integer expression for the start time of the interval variable. If the interval is absent, then its value is `absentValue`.
     *
     * @param absentValue The value to use when the interval is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * This function is equivalent to `interval.start().guard(absentValue)`.
     *
     * @see {@link IntervalVar.start}
     * @see {@link IntExpr.guard}
     */
    startOr(absentValue) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        return IntExpr._Create(this._cp, "startOr", outParams);
    }
    /**
     * Creates an integer expression for the end time of the interval variable. If the interval is absent, then its value is `absentValue`.
     *
     * @param absentValue The value to use when the interval is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * This function is equivalent to `interval.end().guard(absentValue)`.
     *
     * @see {@link IntervalVar.end}
     * @see {@link IntExpr.guard}
     */
    endOr(absentValue) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        return IntExpr._Create(this._cp, "endOr", outParams);
    }
    /**
     * Creates an integer expression for the duration (end - start) of the interval variable. If the interval is absent, then its value is `absentValue`.
     *
     * @param absentValue The value to use when the interval is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * This function is equivalent to `interval.length().guard(absentValue)`.
     *
     * @see {@link IntervalVar.length}
     * @see {@link IntExpr.guard}
     */
    lengthOr(absentValue) {
        let outParams = [this._getArg(), GetInt(absentValue)];
        return IntExpr._Create(this._cp, "lengthOr", outParams);
    }
    /** @internal */
    _overlapLength(interval2) {
        let outParams = [this._getArg(), GetIntervalVar(interval2)];
        return IntExpr._Create(this._cp, "overlapLength", outParams);
    }
    /** @internal */
    _alternativeCost(options, weights) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(options), this._cp._getIntArray(weights)];
        return IntExpr._Create(this._cp, "intAlternativeCost", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).le(successor.end()))
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be less than or equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.endBeforeEnd} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    endBeforeEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "endBeforeEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).le(successor.start()))
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be less than or equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.endBeforeStart} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    endBeforeStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "endBeforeStart", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).le(successor.end()))
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be less than or equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.startBeforeEnd} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    startBeforeEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "startBeforeEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).le(successor.start()))
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be less than or equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.startBeforeStart} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    startBeforeStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "startBeforeStart", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).eq(successor.end()))
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.endAtEnd} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    endAtEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "endAtEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).eq(successor.start()))
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.endAtStart} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    endAtStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "endAtStart", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).eq(successor.end()))
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.startAtEnd} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    startAtEnd(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "startAtEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Assuming that the current interval is `predecessor`, the constraint is the same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).eq(successor.start()))
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link Model.startAtStart} is equivalent function on {@link Model}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    startAtStart(successor, delay = 0) {
        let outParams = [this._getArg(), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this._cp, "startAtStart", outParams);
    }
    /**
     * Creates alternative constraints for the interval variable and provided `options`.
     *
     * @param options The interval variables to choose from.
     *
     * @returns The alternative constraint.
     *
     * @remarks
     * The alternative constraint requires that exactly one of the `options` intervals
     * is present when `self` is present. The selected option must have the same
     * start, end, and length as `self`. If `self` is absent, all options must be absent.
     *
     * This is useful for modeling choices, such as assigning a task to one of several
     * machines, where each option represents the task executed on a different machine.
     *
     * This constraint is equivalent to {@link Model.alternative} with `self` as the main interval.
     */
    alternative(options) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(options)];
        return Constraint._Create(this._cp, "alternative", outParams);
    }
    /**
     * Constrains the interval variable to span (cover) a set of other interval variables.
     *
     * @param covered The set of interval variables to cover.
     *
     * @returns The span constraint.
     *
     * @remarks
     * The span constraint ensures that `self` exactly covers all present intervals
     * in `covered`. Specifically, `self` starts at the minimum start time and ends
     * at the maximum end time of the present covered intervals. If all covered
     * intervals are absent, `self` must also be absent.
     *
     * This is useful for modeling composite tasks or projects where a parent interval
     * represents the overall duration of multiple sub-tasks.
     *
     * This constraint is equivalent to {@link Model.span} with `self` as the spanning interval.
     */
    span(covered) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(covered)];
        return Constraint._Create(this._cp, "span", outParams);
    }
    /**
     * Creates an expression equal to the position of the interval on the sequence.
     *
     * @param sequence The sequence variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * Returns an integer expression representing the 0-based position of this interval
     * in the given sequence. The position reflects the order in which intervals appear
     * after applying the {@link SequenceVar.noOverlap} constraint.
     *
     * If this interval is absent, the position expression is also absent.
     *
     * This method is equivalent to {@link Model.position} with `self` as the interval.
     */
    position(sequence) {
        let outParams = [this._getArg(), GetSequenceVar(sequence)];
        return IntExpr._Create(this._cp, "position", outParams);
    }
    /**
     * Creates cumulative function (expression) pulse for the interval variable and specified height.
     *
     * @param height The height value.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * **Limitation:** The `height` must be non-negative. Pulses with negative height are not supported.
     *
     * This function is the same as {@link Model.pulse}.
     *
     * @example
     * ```ts
     * let task = model.intervalVar({name: "task", length: 10});
     * let pulse = task.pulse(5);
     * ```
     *
     * @see {@link Model.pulse} for detailed documentation and examples.
     */
    pulse(height) {
        let outParams = [this._getArg(), GetIntExpr(height)];
        return CumulExpr._Create(this._cp, "pulse", outParams);
    }
    /**
     * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
     *
     * @param height The height value.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
     *
     * This function is the same as {@link Model.stepAtStart}.
     *
     * @example
     * ```ts
     * let task = model.intervalVar({name: "task", length: 10});
     * let step = task.stepAtStart(5);
     * ```
     *
     * @see {@link Model.stepAtStart} for detailed documentation.
     * @see {@link IntervalVar.stepAtEnd} for the opposite function.
     */
    stepAtStart(height) {
        let outParams = [this._getArg(), GetIntExpr(height)];
        return CumulExpr._Create(this._cp, "stepAtStart", outParams);
    }
    /**
     * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
     *
     * @param height The height value.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
     *
     * This function is the same as {@link Model.stepAtEnd}.
     *
     * @example
     * ```ts
     * let task = model.intervalVar({name: "task", length: 10});
     * let step = task.stepAtEnd(5);
     * ```
     *
     * @see {@link Model.stepAtEnd} for detailed documentation.
     * @see {@link IntervalVar.stepAtStart} for the opposite function.
     */
    stepAtEnd(height) {
        let outParams = [this._getArg(), GetIntExpr(height)];
        return CumulExpr._Create(this._cp, "stepAtEnd", outParams);
    }
    /** @internal */
    _precedenceEnergyBefore(others, heights, capacity) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(others), this._cp._getIntArray(heights), GetInt(capacity)];
        return Constraint._Create(this._cp, "precedenceEnergyBefore", outParams);
    }
    /** @internal */
    _precedenceEnergyAfter(others, heights, capacity) {
        let outParams = [this._getArg(), this._cp._getIntervalVarArray(others), this._cp._getIntArray(heights), GetInt(capacity)];
        return Constraint._Create(this._cp, "precedenceEnergyAfter", outParams);
    }
    /**
     * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero.
     *
     * @param func The step function.
     *
     * @returns The constraint forbidding the extent (entire interval).
     *
     * @remarks
     * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero. I.e., if $[s, e)$ is a segment of the step function where the value is zero, then the interval variable either ends before $s$ ($\mathtt{interval.end()} \le s$) or starts after $e$ ($e \le \mathtt{interval.start()}$).
     *
     * ## Example
     *
     * A production task that cannot overlap with scheduled maintenance windows:
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     *
     * // A 3-hour production run
     * const production = model.intervalVar({ length: 3, name: "production" });
     *
     * // Machine availability: 1 = available, 0 = under maintenance
     * const availability = model.stepFunction([
     *     [0, 1],   // Initially available
     *     [8, 0],   // 8h: maintenance starts
     *     [10, 1],  // 10h: maintenance ends
     * ]);
     *
     * // Production cannot overlap periods where availability is 0
     * production.forbidExtent(availability);
     * model.minimize(production.end());
     *
     * const result = await model.solve();
     * // Production runs [0, 3) - finishes before maintenance window
     * ```
     *
     * @see {@link Model.forbidExtent} for the equivalent function on {@link Model}.
     * @see {@link Model.forbidStart}, {@link Model.forbidEnd} for similar functions that constrain the start/end of an interval variable.
     * @see {@link Model.eval} for evaluation of a step function.
     */
    forbidExtent(func) {
        let outParams = [this._getArg(), GetIntStepFunction(func)];
        return Constraint._Create(this._cp, "forbidExtent", outParams);
    }
    /**
     * Constrains the start of an interval variable to not coincide with zero segments of a step function.
     *
     * @param func The step function whose zero segments define forbidden start times.
     *
     * @returns The constraint forbidding the start point.
     *
     * @remarks
     * This function is equivalent to:
     *
     * ```ts
     *   model.enforce(func.eval(interval.start()).ne(0))
     * ```
     *
     * I.e., the function value at the start of the interval variable cannot be zero.
     *
     * ## Example
     *
     * A factory task that can only start during work hours (excluding breaks):
     *
     * @see {@link Model.forbidStart} for the equivalent function on {@link Model}.
     * @see {@link Model.forbidEnd} for similar function that constrains end an interval variable.
     * @see {@link Model.eval} for evaluation of a step function.
     */
    forbidStart(func) {
        let outParams = [this._getArg(), GetIntStepFunction(func)];
        return Constraint._Create(this._cp, "forbidStart", outParams);
    }
    /**
     * Constrains the end of an interval variable to not coincide with zero segments of a step function.
     *
     * @param func The step function whose zero segments define forbidden end times.
     *
     * @returns The constraint forbidding the end point.
     *
     * @remarks
     * This function is equivalent to:
     *
     * ```ts
     *   model.enforce(func.eval(interval.end()).ne(0))
     * ```
     *
     * I.e., the function value at the end of the interval variable cannot be zero.
     *
     * ## Example
     *
     * A delivery task that must complete during business hours (not during lunch break):
     *
     * @see {@link Model.forbidEnd} for the equivalent function on {@link Model}.
     * @see {@link Model.forbidStart} for similar function that constrains start an interval variable.
     * @see {@link Model.eval} for evaluation of a step function.
     */
    forbidEnd(func) {
        let outParams = [this._getArg(), GetIntStepFunction(func)];
        return Constraint._Create(this._cp, "forbidEnd", outParams);
    }
    /** @internal */
    _disjunctiveIsBefore(y) {
        let outParams = [this._getArg(), GetIntervalVar(y)];
        return BoolExpr._Create(this._cp, "disjunctiveIsBefore", outParams);
    }
    /** @internal */
    _related(y) {
        let outParams = [this._getArg(), GetIntervalVar(y)];
        return Directive._Create(this._cp, "related", outParams);
    }
}
// TODO:2 When we have other constraints on sequenceVar then add links into the following doc.
/**
 * @remarks
 * Models a sequence (order) of interval variables.
 *
 * A sequence variable represents an ordered arrangement of interval variables
 * where no two intervals overlap. The sequence captures not just that the intervals
 * don't overlap, but also their relative ordering in the solution.
 *
 * Sequence variables are created using {@link Model.sequenceVar} and are typically
 * used with the {@link SequenceVar.noOverlap} constraint to enforce non-overlapping
 * with optional transition times between intervals.
 *
 * The position of each interval in the sequence can be queried using
 * {@link Model.position} or {@link IntervalVar.position}, which returns an integer
 * expression representing the interval's index in the final ordering (0-based).
 * Absent intervals have an absent position.
 *
 * @see {@link Model.sequenceVar} to create sequence variables.
 * @see {@link SequenceVar.noOverlap} for the no-overlap constraint with transitions.
 * @see {@link Model.position} to get an interval's position in the sequence.
 *
 * @category Modeling
 */
export class SequenceVar extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(SequenceVar.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: cp._getNewRefId(instance._props) };
        return instance;
    }
    // @internal Optimized version (ref is always set):
    _getArg() { return this._arg; }
    /** @internal */
    _makeAuxiliary() { this._props.func = "_sequenceVar"; }
    /**
     * Constrain the interval variables forming the sequence to not overlap.
     *
     * @param transitions 2D square array of minimum transition distances between the intervals. The first index is the type (index) of the first interval in the sequence, the second index is the type (index) of the second interval in the sequence
     *
     * @returns The no-overlap constraint.
     *
     * @remarks
     * The `noOverlap` constraint makes sure that the intervals in the sequence
     * do not overlap.  That is, for every pair of interval variables `x` and `y`
     * at least one of the following conditions must hold (in a solution):
     *
     * 1. Interval variable `x` is *absent*. This means that the interval is not
     * present in the solution (not performed), so it cannot overlap
     * with any other interval. Only optional interval variables can be *absent*.
     * 2. Interval variable `y` is *absent*.
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
     * as given in {@link Model.sequenceVar}. If types were not specified,
     * then they are equal to the indices of the interval variables in the array
     * passed to {@link Model.sequenceVar}. Transition times
     * cannot be negative.
     *
     * Note that transition times are enforced between every pair of interval variables,
     * not only between direct neighbors.
     *
     * The size of the 2D array `transitions` must be equal to the number of types
     * of the interval variables.
     *
     * This constraint is equivalent to {@link Model.noOverlap} called with the
     * sequence variable's intervals and types.
     *
     * @example
     *
     * A worker must perform a set of tasks. Each task is characterized by:
     *
     * * `length` of the task (how long it takes to perform it),
     * * `location` of the task (where it must be performed),
     * * a time window `earliest` to `deadline` when the task must be performed.
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
     *   {location: 0, length: 20, earliest: 0, deadline: 100},
     *   {location: 0, length: 40, earliest: 70, deadline: 200},
     *   {location: 1, length: 10, earliest: 0, deadline: 200},
     *   {location: 1, length: 30, earliest: 100, deadline: 200},
     *   {location: 1, length: 10, earliest: 0, deadline: 150},
     *   {location: 2, length: 15, earliest: 50, deadline: 250},
     *   {location: 2, length: 10, earliest: 20, deadline: 60},
     *   {location: 2, length: 20, earliest: 110, deadline: 250},
     * ];
     *
     * let model = new CP.Model;
     *
     * // From the array tasks create an array of interval variables:
     * let taskVars = tasks.map((t, i) => model.intervalVar(
     *   { name: "Task" + i, length: t.length, start: [t.earliest,], end: [, t.deadline] }
     * ));
     * // And an array of locations:
     * let types = tasks.map(t => t.location);
     *
     * // Create the sequence variable for the tasks, location is the type:
     * let sequence = model.sequenceVar(taskVars, types);
     * // Tasks must not overlap and transitions must be respected:
     * sequence.noOverlap(transitions);
     *
     * // Solve the model:
     * let result = await model.solve({ solutionLimit: 1 });
     * ```
     */
    noOverlap(transitions) {
        return this._noOverlap(transitions);
    }
    /** @internal */
    _noOverlap(transitions) {
        let outParams = [this._getArg()];
        if (transitions !== undefined)
            outParams.push(this._cp._getIntMatrix(transitions));
        return Constraint._Create(this._cp, "noOverlap", outParams);
    }
    /** @internal */
    _sameSequence(sequence2) {
        let outParams = [this._getArg(), GetSequenceVar(sequence2)];
        return Constraint._Create(this._cp, "sameSequence", outParams);
    }
}
/**
 * @remarks
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
 *   Pulse can be created by function {@link Model.pulse}
 *   or {@link IntervalVar.pulse}.
 * * ***Step***: a given amount of resource is consumed or produced at a specified
 *   time (e.g., at the start of an interval variable).
 *   Steps may represent an inventory of a material that is
 *   consumed or produced by some tasks (a _reservoir_).
 *   Steps can be created by functions
 *   {@link Model.stepAtStart},
 *   {@link IntervalVar.stepAtStart},
 *   {@link Model.stepAtEnd},
 *   {@link IntervalVar.stepAtEnd}. and
 *   {@link Model.stepAt}.
 *
 * Cumulative expressions can be combined using
 * {@link CumulExpr.plus}, {@link CumulExpr.minus}, {@link CumulExpr.neg} and
 * {@link Model.sum}. The resulting cumulative expression represents
 * a sum of the resource usage of the combined expressions.
 *
 * Cumulative expressions can be constrained by {@link CumulExpr.ge} and
 * {@link CumulExpr.le} to specify the minimum and maximum
 * allowed resource usage.
 *
 * **Limitations:**
 *
 * * Pulse-based and step-based cumulative expressions cannot be mixed.
 * * Pulses cannot have negative height. Use `-` and unary `-` only with step-based expressions.
 *
 * See {@link CumulExpr.le} and {@link CumulExpr.ge} for examples.
 *
 * @category Modeling
 */
export class CumulExpr extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(CumulExpr.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
    /** @internal @deprecated Use `CumulExpr.plus` instead. */
    cumulPlus(rhs) {
        return this.plus(rhs);
    }
    /** @internal @deprecated Use `CumulExpr.minus` instead. */
    cumulMinus(rhs) {
        return this.minus(rhs);
    }
    /** @internal @deprecated Use `CumulExpr.le` instead. */
    cumulLe(maxCapacity) {
        return this.le(maxCapacity);
    }
    /** @internal @deprecated Use `CumulExpr.ge` instead. */
    cumulGe(minCapacity) {
        return this.ge(minCapacity);
    }
    /** @internal @deprecated Use `CumulExpr.neg` instead. */
    cumulNeg() {
        return this.neg();
    }
    /**
     * Addition of two cumulative expressions.
     *
     * @param rhs The right-hand side cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * This function is the same as {@link Model.plus}.
     */
    plus(rhs) {
        let outParams = [this._getArg(), GetCumulExpr(rhs)];
        return CumulExpr._Create(this._cp, "cumulPlus", outParams);
    }
    /**
     * Subtraction of two cumulative expressions.
     *
     * @param rhs The right-hand side cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * This function is the same as {@link Model.minus}.
     */
    minus(rhs) {
        let outParams = [this._getArg(), GetCumulExpr(rhs)];
        return CumulExpr._Create(this._cp, "cumulMinus", outParams);
    }
    /**
     * Negation of a cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * This function is the same as {@link Model.neg}.
     */
    neg() {
        let outParams = [this._getArg()];
        return CumulExpr._Create(this._cp, "cumulNeg", outParams);
    }
    /**
     * Constrains the cumulative function to be everywhere less or equal to `maxCapacity`.
     *
     * @param maxCapacity The maximum capacity value, which can be a constant or an expression.
     *
     * @returns The constraint object
     *
     * @remarks
     * This function can be used to specify the maximum limit of resource usage at any time. For example, to limit the number of workers working simultaneously, limit the maximum amount of material on stock, etc.
     *
     * The `maxCapacity` can be a constant value or an expression. When an expression is used (such as an {@link IntVar}), the capacity becomes variable and is determined during the search.
     *
     * **Limitations:**
     *
     * - Variable capacity is only supported for discrete resources (pulses). Reservoir resources (steps) require a constant capacity.
     * - The capacity expression must not be optional or absent.
     *
     * See {@link Model.pulse} for an example with `le`.
     *
     * ### Example with variable capacity
     *
     * ```ts
     * let model = new CP.Model;
     * let task1 = model.intervalVar({ length: 5, name: "task1" });
     * let task2 = model.intervalVar({ length: 10, name: "task2" });
     *
     * // Variable capacity
     * let extraCapacity = model.intVar({ min: 0, max: 3, name: "extraCapacity" });
     * let totalCapacity = model.plus(4, extraCapacity);
     *
     * let cumul = model.sum([task1.pulse(2), task2.pulse(3)]);
     * cumul.le(totalCapacity);
     *
     * model.minimize(extraCapacity);
     * ```
     *
     * @see {@link Model.le} for the equivalent function on {@link Model}.
     * @see {@link Model.ge} for the opposite constraint.
     */
    le(maxCapacity) {
        let outParams = [this._getArg(), GetIntExpr(maxCapacity)];
        return Constraint._Create(this._cp, "cumulLe", outParams);
    }
    /**
     * This function can be used to specify the minimum limit of resource usage at any time. `minCapacity`.
     *
     * @param minCapacity The minimum capacity value.
     *
     * @returns The constraint object
     *
     * @remarks
     * This function can be used to specify the minimum limit of resource usage at any time. For example to make sure that there is never less than zero material on stock.
     * See {@link Model.stepAtStart} for an example with `ge`.
     *
     * @see {@link Model.ge} for the equivalent function on {@link Model}.
     * @see {@link Model.le} for the opposite constraint.
     */
    ge(minCapacity) {
        let outParams = [this._getArg(), GetInt(minCapacity)];
        return Constraint._Create(this._cp, "cumulGe", outParams);
    }
    /** @internal */
    _cumulMaxProfile(profile) {
        let outParams = [this._getArg(), GetIntStepFunction(profile)];
        return Constraint._Create(this._cp, "cumulMaxProfile", outParams);
    }
    /** @internal */
    _cumulMinProfile(profile) {
        let outParams = [this._getArg(), GetIntStepFunction(profile)];
        return Constraint._Create(this._cp, "cumulMinProfile", outParams);
    }
}
/**
 * @remarks
 * Integer step function.
 *
 * Integer step function is a piecewise constant function defined on integer
 * values in range {@link IntVarMin} to {@link IntVarMax}. The function can be
 * created by {@link Model.stepFunction}.
 *
 * Step functions can be used in the following ways:
 *
 * * Function {@link Model.eval} evaluates the function at the given point (given as {@link IntExpr}).
 * * Function {@link Model.integral} computes a sum (integral) of the function over an {@link IntervalVar}.
 * * Constraints {@link Model.forbidStart} and {@link Model.forbidEnd} forbid the start/end of an {@link IntervalVar} to be in a zero-value interval of the function.
 * * Constraint {@link Model.forbidExtent} forbids the extent of an {@link IntervalVar} to be in a zero-value interval of the function.
 *
 * @category Modeling
 */
export class IntStepFunction extends ModelElement {
    /** @internal */
    static _CreateWithValues(cp, values) {
        const instance = Object.create(IntStepFunction.prototype);
        instance._cp = cp;
        instance._props = { func: "intStepFunction", args: [] };
        instance._arg = { arg: undefined, ref: undefined };
        // Copy the array so that the user cannot change it later.
        instance._props.values = Array.from(values, v => {
            assert(Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]), "Step function item is not in the form [integer, integer].");
            return Array.from(v);
        });
        return instance;
    }
    /**
     * Computes sum of values of the step function over the interval `interval`.
     *
     * @param interval The interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * The sum is computed over all integer time points from `interval.start()` to `interval.end()-1` inclusive. In other words, the sum includes the function value at the start time but excludes the value at the end time (half-open interval). If the interval variable has zero length, then the result is 0. If the interval variable is absent, then the result is *absent*.
     *
     * **Requirement**: The step function `func` must be non-negative.
     *
     * @see {@link Model.integral} for the equivalent function on {@link Model}.
     */
    integral(interval) {
        let outParams = [this._getArg(), GetIntervalVar(interval)];
        return IntExpr._Create(this._cp, "intStepFunctionIntegral", outParams);
    }
    /** @internal */
    _stepFunctionIntegralInRange(interval, lb, ub) {
        let outParams = [this._getArg(), GetIntervalVar(interval), GetInt(lb), GetInt(ub)];
        return Constraint._Create(this._cp, "intStepFunctionIntegralInRange", outParams);
    }
    /**
     * Evaluates the step function at a given point.
     *
     * @param arg The point at which to evaluate the step function.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * The result is the value of the step function at the point `arg`. If the value of `arg` is `absent`, then the result is also `absent`.
     *
     * By constraining the returned value, it is possible to limit `arg` to be only within certain segments of the segmented function. In particular, functions {@link Model.forbidStart} and {@link Model.forbidEnd} work that way.
     *
     * @see {@link Model.eval} for the equivalent function on {@link Model}.
     * @see {@link Model.forbidStart}, {@link Model.forbidEnd} are convenience functions built on top of `eval`.
     */
    eval(arg) {
        let outParams = [this._getArg(), GetIntExpr(arg)];
        return IntExpr._Create(this._cp, "intStepFunctionEval", outParams);
    }
    /** @internal */
    _stepFunctionEvalInRange(arg, lb, ub) {
        let outParams = [this._getArg(), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        return Constraint._Create(this._cp, "intStepFunctionEvalInRange", outParams);
    }
    /** @internal */
    _stepFunctionEvalNotInRange(arg, lb, ub) {
        let outParams = [this._getArg(), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        return Constraint._Create(this._cp, "intStepFunctionEvalNotInRange", outParams);
    }
    /** @internal @deprecated Use `IntStepFunction.integral` instead. */
    stepFunctionSum(interval) {
        return this.integral(interval);
    }
    /** @internal @deprecated Use `IntStepFunction.eval` instead. */
    stepFunctionEval(x) {
        return this.eval(x);
    }
}
/** @internal */
function GetIntStepFunction(arg) {
    VerifyInstanceOf(arg, IntStepFunction);
    return arg._getArg();
}
/** @internal */
class SearchDecision extends ModelElement {
    /** @internal */
    static _Create(cp, func, args) {
        const instance = Object.create(SearchDecision.prototype);
        instance._cp = cp;
        instance._props = { func, args };
        instance._arg = { arg: undefined, ref: undefined };
        return instance;
    }
}
// === Verification functions ================================================
/** @internal */
function GetInt(arg) {
    if (TYPE_CHECK_LEVEL >= 1)
        assert(Number.isInteger(arg));
    return arg;
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
        assert(typeof arg === 'boolean');
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
    if (typeof arg === 'number')
        return arg;
    VerifyInstanceOf(arg, FloatExpr);
    return arg._getArg();
}
/** @internal */
function GetIntExpr(arg) {
    if (typeof arg === 'number')
        return GetInt(arg);
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
    if (typeof (arg) === 'boolean')
        return arg;
    VerifyInstanceOf(arg, BoolExpr);
    return arg._getArg();
}
/** @internal */
function GetConstraint(arg) {
    if (typeof (arg) === 'boolean')
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
function IsIntExpr(arg) {
    if (typeof (arg) === "number")
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
function IsIterable(obj) {
    return obj !== null && obj !== undefined && typeof obj[Symbol.iterator] === 'function';
}
// printLog can be WritableStream which is not clonable by structuredClone
const NON_CLONABLE_FIELDS = ['printLog'];
/**
 * Creates a deep copy of the input Parameters object.
 *
 * @param params The Parameters object to copy
 *
 * @returns A deep copy of the input Parameters object.
 *
 * @remarks
 * Creates a deep copy of the input {@link Parameters} object.
 * Afterwards, the copy can be modified without affecting
 * the original {@link Parameters} object.
 *
 * ```ts
 * import * as cp from "@scheduleopt/optalcp";
 *
 * const params: cp.Parameters = { timeLimit: 60, nbWorkers: 4 };
 * const copy = cp.copyParameters(params);
 * copy.timeLimit = 120; // Does not affect original params
 * ```
 *
 * @category Parameters
 */
export function copyParameters(params) {
    // Extract non-clonable fields
    const nonClonable = {};
    for (const key of NON_CLONABLE_FIELDS) {
        if (key in params)
            nonClonable[key] = params[key];
    }
    // Deep copy the rest
    const toCopy = { ...params };
    for (const key of NON_CLONABLE_FIELDS)
        delete toCopy[key];
    const result = structuredClone(toCopy);
    // Restore non-clonable fields (same reference)
    return { ...result, ...nonClonable };
}
/**
 * Merges two Parameters settings into a new one.
 *
 * @param base Base parameters that can be overridden
 * @param overrides Parameters that will overwrite values from base
 *
 * @returns The merged parameters object
 *
 * @remarks
 * The new object contains all parameters from both inputs. If the same
 * parameter is specified in both input objects, then the value from `overrides`
 * is used.
 *
 * Input objects are not modified.
 *
 * ```ts
 * import * as cp from "@scheduleopt/optalcp";
 *
 * const defaults: cp.Parameters = { timeLimit: 60, nbWorkers: 4 };
 * const overrides: cp.Parameters = { timeLimit: 120 };
 * const merged = cp.mergeParameters(defaults, overrides);
 * // merged = { timeLimit: 120, nbWorkers: 4 }
 * ```
 *
 * @category Parameters
 */
export function mergeParameters(base, overrides) {
    let result = copyParameters(base);
    for (const key in overrides) {
        if (key === "workers")
            continue;
        result[key] = overrides[key];
    }
    if (overrides.workers !== undefined) {
        result.workers ??= [];
        for (let i = 0; i < overrides.workers.length; i++) {
            const w = overrides.workers[i];
            if (w === undefined)
                continue;
            if (result.workers[i] === undefined)
                result.workers[i] = { ...w };
            else
                for (const key in w)
                    result.workers[i][key] = w[key];
        }
    }
    return result;
}
/** @internal @deprecated Use function mergeParameters instead. */
export function combineParameters(base, overrides) {
    return mergeParameters(base, overrides);
}
/**
 @internal
 Converts +/-Infinity values to strings for JSON serialization.
 Mutates the object in place - only call on copies, not user data.
 */
function infinitiesToString(obj) {
    for (const key in obj)
        if (obj[key] === Infinity)
            obj[key] = 'Infinity';
        else if (obj[key] === -Infinity)
            obj[key] = '-Infinity';
}
/**
 @internal
 Converts string infinity values back to numbers after JSON parsing.
 Mutates the object in place.
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
    delete result.solver;
    delete result.solverArgs;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    delete result.usage;
    delete result.printLog;
    // JSON is not able to handle infinities, so convert them to strings:
    infinitiesToString(result);
    if (result.workers !== undefined)
        for (let w of result.workers)
            infinitiesToString(w);
    return result;
}
/** @internal */
function paramsFromJSON(params) {
    if (params === undefined)
        return {};
    parseInfinities(params);
    if (params.workers !== undefined)
        for (let w of params.workers)
            parseInfinities(w);
    return params;
}
/** @internal */
function isWebSocketUrl(s) {
    return /^wss?:\/\/|^https?:\/\//.test(s);
}
/**
 * @remarks
 * Solution of a {@link Model}. When a model is solved, the solution is stored
 * in this object. The solution contains values of all variables in the model
 * (including optional variables) and the value of the objective (if the model
 * specified one).
 *
 * ### Preview version of OptalCP
 *
 * Note that in the preview version of OptalCP, the values of variables in
 * the solution are masked and replaced by value *absent* (`null`).
 *
 * @category Solving
 */
export class Solution {
    #values;
    #objective;
    /**
     * Creates an empty solution.
     *
     * @remarks
     * Creates a solution where all variables are absent, and the
     * objective value is `None`/`undefined`.
     *
     * Use this constructor to create an external solution that can be passed to
     * the solver as a warm start (see {@link Model.solve})
     * or sent during solving using {@link Solver.sendSolution}.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "x" });
     * model.minimize(x.end());
     *
     * // Create an external solution
     * const solution = new CP.Solution();
     * solution.setValue(x, 0, 10);  // x starts at 0, ends at 10
     *
     * // Use it as a warm start
     * const result = await model.solve({ timeLimit: 60 }, solution);
     * ```
     *
     * @category Solving
     */
    constructor() {
        this.#values = [];
        this.#objective = undefined;
    }
    /** @internal (read from a message sent by the solver) */
    _init(msg) {
        this.#values = [];
        if (msg.values) {
            for (var v of msg.values)
                this.#values[v.id] = v.value;
        }
        this.#objective = msg.objective;
    }
    /**
     * Returns the objective value of the solution.
     *
     * @returns The objective value
     *
     * @remarks
     * Returns `null` if no objective was specified or if the objective expression
     * is *absent* (see optional {@link IntExpr}).
     *
     * The correct value is reported even in the preview version of OptalCP.
     */
    getObjective() { return this.#objective; }
    /** @internal */
    isPresent(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        let val = this.#values[variable._getId()];
        return val !== null && val !== undefined;
    }
    isAbsent(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        let val = this.#values[variable._getId()];
        return val === null || val === undefined;
    }
    // Return type above is IntervalVarValue, but it is spelled out for doc generation (it is the only place where it is public)
    getValue(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        let result = this.#values[variable._getId()];
        if (result === undefined)
            return null;
        if (!(variable instanceof BoolVar))
            return result;
        if (result === null)
            return null;
        return result === 1;
    }
    /**
     * Gets an interval variable's start time from the solution.
     *
     * @param variable The interval variable to query
     *
     * @returns The start value, or None if absent
     *
     * @remarks
     * If the variable is *absent* in the solution, it returns `null`.
     *
     * In the preview version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value *absent*.
     */
    getStart(variable) {
        const value = this.#values[variable._getId()];
        if (value === undefined || value === null)
            return null;
        return value.start;
    }
    /**
     * Gets an interval variable's end time from the solution.
     *
     * @param variable The interval variable to query
     *
     * @returns The end value, or None if absent
     *
     * @remarks
     * If the variable is *absent* in the solution, it returns `null`.
     *
     * In the preview version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value *absent*.
     */
    getEnd(variable) {
        const value = this.#values[variable._getId()];
        if (value === undefined || value === null)
            return null;
        return value.end;
    }
    /**
     * Gets an interval variable's length from the solution.
     *
     * @param variable The interval variable to query
     *
     * @returns The length value, or None if absent
     *
     * @remarks
     * If the variable is *absent* in the solution, it returns `null`.
     *
     * In the preview version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value *absent*.
     */
    getLength(variable) {
        const value = this.#values[variable._getId()];
        if (value === undefined || value === null)
            return null;
        return value.end - value.start;
    }
    /**
     * Sets objective value of the solution.
     *
     * @param value The objective value to set
     *
     * @remarks
     * This function can be used for construction of an external solution that can be
     * passed to the solver (see {@link Model.solve}, {@link Solver} and
     * {@link Solver.sendSolution}).
     */
    setObjective(value) { this.#objective = value; }
    setAbsent(variable) {
        assert(!variable._getProps().func.startsWith("_")); // Can't set values of auxiliary variables
        this.#values[variable._getId()] = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * @category Propagation
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
        return this.#domains[v._getId()].presence === 1 /* PresenceStatus.Present */;
    }
    /** @internal */
    isAbsent(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#domains[v._getId()].presence === 2 /* PresenceStatus.Absent */;
    }
    /** @internal */
    isOptional(v) {
        assert(!v._getProps().func.startsWith("_")); // Can't ask for values of auxiliary variables
        return this.#domains[v._getId()].presence === 0 /* PresenceStatus.Optional */;
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
 * @remarks
 * _Model_ captures the problem to be solved. It contains variables,
 * constraints and objective function.
 *
 * To create an optimization model, you must first create a _Model_ object.
 * Then you can use the methods of the _Model_ to create variables (e.g. {@link Model.intervalVar}), the objective function ({@link Model.minimize} or {@link Model.maximize})
 * and constraints (e.g. {@link Model.noOverlap}).
 * Note that a boolean expression becomes a constraint only by passing it to
 * {@link Model.enforce}; otherwise, it is not enforced.
 *
 * To solve a model, pass it to function {@link Model.solve} or to {@link Solver}
 * class.
 *
 * ## Available modeling elements
 *
 * ### Variables
 *
 * Interval variables can be created by function {@link Model.intervalVar}, integer variables by function {@link Model.intVar}.
 *
 * ### Basic integer expressions
 *
 * * {@link Model.start}: start of an interval variable (optional integer expression).
 * * {@link Model.end}:   end of an interval variable (optional integer expression).
 * * {@link Model.length}: length of an interval variable (optional integer expression).
 * * {@link Model.guard}: replaces *absent* value by a constant.
 *
 * ### Integer arithmetics
 *
 * * {@link Model.plus}:  addition.
 * * {@link Model.minus}: subtraction.
 * * {@link Model.neg}:   negation (changes sign).
 * * {@link Model.times}: multiplication.
 * * {@link Model.div}:   division (rounds to zero).
 *
 * * {@link Model.abs}:   absolute value.
 * * {@link Model.min2}:  minimum of two integer expressions.
 * * {@link Model.min}:   minimum of an array of integer expressions.
 * * {@link Model.max2}:  maximum of two integer expressions.
 * * {@link Model.max}:   maximum of an array of integer expressions.
 * * {@link Model.sum}:   sum of an array of integer expressions.
 *
 * ### Comparison operators for integer expressions
 *
 * * {@link Model.eq}: equality.
 * * {@link Model.ne}: inequality.
 * * {@link Model.lt}: less than.
 * * {@link Model.le}: less than or equal to.
 * * {@link Model.gt}: greater than.
 * * {@link Model.ge}: greater than or equal to.
 *
 * * {@link Model.identity}: constraints two integer expressions to be equal, including the presence status.
 *
 * ### Boolean operators
 *
 * * {@link Model.not}: negation.
 * * {@link Model.and}: conjunction.
 * * {@link Model.or}:  disjunction.
 * * {@link Model.implies}: implication.
 *
 * ### Functions returning {@link BoolExpr}
 *
 * * {@link Model.presence}: whether the argument is *present* or *absent*.
 * * {@link Model.inRange}: whether an integer expression is within the given range
 *
 * ### Basic constraints on interval variables
 *
 * * {@link Model.alternative}: an alternative between multiple interval variables.
 * * {@link Model.span}: span (cover) of interval variables.
 * * {@link Model.endBeforeEnd}, {@link Model.endBeforeStart}, {@link Model.startBeforeEnd}, {@link Model.startBeforeStart},
 *   {@link Model.endAtStart}, {@link Model.startAtEnd}: precedence constraints.
 *
 * ### Disjunction (noOverlap)
 *
 * * {@link Model.sequenceVar}: sequence variable over a set of interval variables.
 * * {@link Model.noOverlap}: constraints a set of interval variables to not overlap (possibly with transition times).
 * * {@link Model.position}: returns the position of an interval variable in a sequence.
 *
 * ### Basic cumulative expressions
 *
 * * {@link Model.pulse}: changes value during the interval variable.
 * * {@link Model.stepAtStart}: changes value at the start of the interval variable.
 * * {@link Model.stepAtEnd}: changes value at the end of the interval variable.
 * * {@link Model.stepAt}: changes value at a given time.
 *
 * ### Combining cumulative expressions
 *
 * * {@link CumulExpr.neg}: negation.
 * * {@link CumulExpr.plus}: addition.
 * * {@link CumulExpr.minus}: subtraction.
 * * {@link Model.sum}: sum of multiple expressions.
 *
 * ### Constraints on cumulative expressions
 *
 * * {@link CumulExpr.ge}: greater than or equal to a constant.
 * * {@link CumulExpr.le}: less than or equal to a constant.
 *
 * ### Objective
 *
 * * {@link Model.minimize}: minimize an integer expression.
 * * {@link Model.maximize}: maximize an integer expression.
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
 * model.sum(workerUsage).le(nbWorkers);
 * // From an array of tasks, create an array of their ends:
 * let ends = tasks.map(t => t.end());
 * // And minimize the maximum of the ends:
 * model.max(ends).minimize();
 *
 * try {
 *   // Solve the model with the provided parameters:
 *   let result = await model.solve({
 *     timeLimit: 3, // Stop after 3 seconds
 *     nbWorkers: 4, // Use for CPU threads
 *   });
 *
 *   if (result.nbSolutions == 0)
 *     console.log("No solution found.");
 *   else {
 *     const solution = result.solution!;
 *     // Note that in the preview version of the solver, the variable values in
 *     // the solution are masked, i.e. they are all *absent* (`null` in JavaScript).
 *     // Objective value is not masked though.
 *     console.log("Solution found with makespan " + solution.getObjective());
 *     for (let task of tasks) {
 *       let start = solution.getStart(task);
 *       if (start !== null)
 *         console.log("Task " + task.name + " starts at " + start);
 *       else
 *         console.log("Task " + task.name + " is absent (not scheduled).")
 *     }
 *   }
 *
 * } catch (e) {
 *   // In case of error, model.solve returns a rejected promise.
 *   // Therefore, "await model.solve" throws an exception.
 *   console.log("Error: " + (e as Error).message);
 * }
 * ```
 *
 * @see {@link Model.solve}.
 * @see {@link Solution}.
 * @see {@link Solver}.
 *
 * @category Modeling
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
     * Creates an empty optimization model.
     *
     * @param name Optional name for the model
     *
     * @remarks
     * Creates an empty model with no variables, constraints, or objective.
     *
     * The optional `name` parameter can be used to identify the model in logs,
     * debugging output, and benchmarking reports. When not specified, the model
     * remains unnamed.
     *
     * After creating a model, use its methods to define:
     *
     * - **Variables**: {@link Model.intervalVar}, {@link Model.intVar}, {@link Model.boolVar}
     * - **Constraints**: {@link Model.noOverlap}, {@link Model.endBeforeStart}, {@link Model.enforce}, etc.
     * - **Objective**: {@link Model.minimize} or {@link Model.maximize}
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * // Create an unnamed model
     * const model = new CP.Model();
     *
     * // Create a named model (useful for debugging)
     * const namedModel = new CP.Model("JobShop");
     *
     * // Add variables and constraints
     * const task = model.intervalVar({ length: 10, name: "task" });
     * model.minimize(task.end());
     *
     * // Solve
     * const result = await model.solve();
     * ```
     *
     * @see {@link Model} for available modeling methods.
     * @see {@link Model.solve} to solve the model.
     *
     * @category Modeling
     */
    constructor(name) {
        this.#name = name;
    }
    // Include generated API for the model:
    /** @internal */
    _reusableBoolExpr(value) {
        let outParams = [GetBoolExpr(value)];
        return BoolExpr._Create(this, "reusableBoolExpr", outParams);
    }
    /** @internal */
    _reusableIntExpr(value) {
        let outParams = [GetIntExpr(value)];
        return IntExpr._Create(this, "reusableIntExpr", outParams);
    }
    /** @internal */
    _reusableFloatExpr(value) {
        let outParams = [GetFloatExpr(value)];
        return FloatExpr._Create(this, "reusableFloatExpr", outParams);
    }
    /**
     * Negation of the boolean expression `arg`.
     *
     * @param arg The boolean expression to negate.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the argument has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link BoolExpr.not}.
     */
    not(arg) {
        let outParams = [GetBoolExpr(arg)];
        return BoolExpr._Create(this, "boolNot", outParams);
    }
    /**
     * Logical _OR_ of boolean expressions `lhs` and `rhs`.
     *
     * @param lhs The first boolean expression.
     * @param rhs The second boolean expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link BoolExpr.or}.
     */
    or(lhs, rhs) {
        let outParams = [GetBoolExpr(lhs), GetBoolExpr(rhs)];
        return BoolExpr._Create(this, "boolOr", outParams);
    }
    /**
     * Logical _AND_ of boolean expressions `lhs` and `rhs`.
     *
     * @param lhs The first boolean expression.
     * @param rhs The second boolean expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link BoolExpr.and}.
     */
    and(lhs, rhs) {
        let outParams = [GetBoolExpr(lhs), GetBoolExpr(rhs)];
        return BoolExpr._Create(this, "boolAnd", outParams);
    }
    /**
     * Logical implication of two boolean expressions, that is `lhs` implies `rhs`.
     *
     * @param lhs The first boolean expression.
     * @param rhs The second boolean expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link BoolExpr.implies}.
     */
    implies(lhs, rhs) {
        let outParams = [GetBoolExpr(lhs), GetBoolExpr(rhs)];
        return BoolExpr._Create(this, "boolImplies", outParams);
    }
    /** @internal */
    _eq(lhs, rhs) {
        let outParams = [GetBoolExpr(lhs), GetBoolExpr(rhs)];
        return BoolExpr._Create(this, "boolEq", outParams);
    }
    /** @internal */
    _ne(lhs, rhs) {
        let outParams = [GetBoolExpr(lhs), GetBoolExpr(rhs)];
        return BoolExpr._Create(this, "boolNe", outParams);
    }
    /** @internal */
    _nand(lhs, rhs) {
        let outParams = [GetBoolExpr(lhs), GetBoolExpr(rhs)];
        return BoolExpr._Create(this, "boolNand", outParams);
    }
    /**
     * Creates an expression that replaces value *absent* by a constant.
     *
     * @param arg The integer expression to guard.
     * @param absentValue The value to use when the expression is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * The resulting expression is:
     *
     * * equal to `arg` if `arg` is *present*
     * * and equal to `absentValue` otherwise (i.e. when `arg` is *absent*).
     *
     * The default value of `absentValue` is 0.
     *
     * The resulting expression is never *absent*.
     *
     * Same as {@link IntExpr.guard}.
     */
    guard(arg, absentValue = 0) {
        let outParams = [GetIntExpr(arg), GetInt(absentValue)];
        return IntExpr._Create(this, "intGuard", outParams);
    }
    /**
     * Creates a multiplication of the two integer expressions, i.e. `lhs * rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link IntExpr.times}.
     */
    times(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return IntExpr._Create(this, "intTimes", outParams);
    }
    /**
     * Creates an integer division of the two integer expressions, i.e. `lhs div rhs`. The division rounds towards zero.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If one of the arguments has value *absent*, the resulting expression also has value *absent*.
     *
     * Same as {@link IntExpr.div}.
     */
    div(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return IntExpr._Create(this, "intDiv", outParams);
    }
    /** @internal */
    _modulo(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return IntExpr._Create(this, "modulo", outParams);
    }
    /**
     * Constrains `lhs` and `rhs` to be identical, including their presence status.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The identity constraint.
     *
     * @remarks
     * Identity is different than equality. For example, if `x` is *absent*, then `eq(x, 0)` is *absent*, but `identity(x, 0)` is `false`.
     *
     * Same as {@link IntExpr.identity}.
     */
    identity(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return Constraint._Create(this, "intIdentity", outParams);
    }
    /**
     * Creates Boolean expression `lhs` = `rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Use {@link Model.enforce} to add this expression as a constraint to the model.
     *
     * Same as {@link IntExpr.eq}.
     */
    eq(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return BoolExpr._Create(this, "intEq", outParams);
    }
    /**
     * Creates Boolean expression `lhs` &ne; `rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Use {@link Model.enforce} to add this expression as a constraint to the model.
     *
     * Same as {@link IntExpr.ne}.
     */
    ne(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return BoolExpr._Create(this, "intNe", outParams);
    }
    /**
     * Creates Boolean expression `lhs` < `rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Use {@link Model.enforce} to add this expression as a constraint to the model.
     *
     * Same as {@link IntExpr.lt}.
     */
    lt(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return BoolExpr._Create(this, "intLt", outParams);
    }
    /**
     * Creates Boolean expression `lhs` > `rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Use {@link Model.enforce} to add this expression as a constraint to the model.
     *
     * Same as {@link IntExpr.gt}.
     */
    gt(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return BoolExpr._Create(this, "intGt", outParams);
    }
    /**
     * Creates Boolean expression `lb` &le; `arg` &le; `ub`.
     *
     * @param arg The integer expression to check.
     * @param lb The lower bound of the range.
     * @param ub The upper bound of the range.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If `arg` has value *absent* then the resulting expression has also value *absent*.
     *
     * Use {@link Model.enforce} to add this expression as a constraint to the model.
     *
     * Same as {@link IntExpr.inRange}.
     */
    inRange(arg, lb, ub) {
        let outParams = [GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        return BoolExpr._Create(this, "intInRange", outParams);
    }
    /** @internal */
    _notInRange(arg, lb, ub) {
        let outParams = [GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        return BoolExpr._Create(this, "intNotInRange", outParams);
    }
    /**
     * Creates an integer expression which is absolute value of `arg`.
     *
     * @param arg The integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If `arg` has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link IntExpr.abs}.
     */
    abs(arg) {
        let outParams = [GetIntExpr(arg)];
        return IntExpr._Create(this, "intAbs", outParams);
    }
    /**
     * Creates an integer expression which is the minimum of `lhs` and `rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link IntExpr.min2}. See {@link Model.min} for n-ary minimum.
     */
    min2(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return IntExpr._Create(this, "intMin2", outParams);
    }
    /**
     * Creates an integer expression which is the maximum of `lhs` and `rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link IntExpr.max2}. See {@link Model.max} for n-ary maximum.
     */
    max2(lhs, rhs) {
        let outParams = [GetIntExpr(lhs), GetIntExpr(rhs)];
        return IntExpr._Create(this, "intMax2", outParams);
    }
    /** @internal */
    _square(arg) {
        let outParams = [GetIntExpr(arg)];
        return IntExpr._Create(this, "intSquare", outParams);
    }
    /**
     * Creates an integer expression for the maximum of the arguments.
     *
     * @param args Array of integer expressions to compute maximum of.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * Absent arguments are ignored as if they were not specified in the input array `args`. Maximum of an empty set (i.e. `max([])` is *absent*. The maximum is *absent* also if all arguments are *absent*.
     *
     * Note that binary function {@link Model.max2} handles absent values differently. For example, when `x` is *absent* then:
     *
     * * `max2(x, 5)` is *absent*.
     * * `max([x, 5])` is 5.
     * * `max([x])` is *absent*.
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
     *
     * Notice that when a task is *absent* (not executed), then its end time is *absent*. And therefore, the absent task is not included in the maximum.
     *
     * @see Binary {@link Model.max2}.
     * @see Function {@link Model.span} constraints interval variable to start and end at minimum and maximum of the given set of intervals.
     */
    max(args) {
        let outParams = [this._getIntExprArray(args)];
        return IntExpr._Create(this, "intMax", outParams);
    }
    /**
     * Creates an integer expression for the minimum of the arguments.
     *
     * @param args Array of integer expressions to compute minimum of.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * Absent arguments are ignored as if they were not specified in the input array `args`. Minimum of an empty set (i.e. `min([])`) is *absent*. The minimum is *absent* also if all arguments are *absent*.
     *
     * Note that binary function {@link Model.min2} handles absent values differently. For example, when `x` is *absent* then:
     *
     * * `min2(x, 5)` is *absent*.
     * * `min([x, 5])` is 5.
     * * `min([x])` is *absent*.
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
     *
     * Notice that when a task is *absent* (not executed), its end time is *absent*. And therefore, the absent task is not included in the minimum.
     *
     * @see Binary {@link Model.min2}.
     * @see Function {@link Model.span} constraints interval variable to start and end at minimum and maximum of the given set of intervals.
     */
    min(args) {
        let outParams = [this._getIntExprArray(args)];
        return IntExpr._Create(this, "intMin", outParams);
    }
    /** @internal */
    _intPresentLinearExpr(coefficients, expressions, constantTerm = 0) {
        let outParams = [this._getIntArray(coefficients), this._getIntExprArray(expressions), GetInt(constantTerm)];
        return IntExpr._Create(this, "intPresentLinearExpr", outParams);
    }
    /** @internal */
    _intOptionalLinearExpr(coefficients, expressions, constantTerm = 0) {
        let outParams = [this._getIntArray(coefficients), this._getIntExprArray(expressions), GetInt(constantTerm)];
        return IntExpr._Create(this, "intOptionalLinearExpr", outParams);
    }
    /** @internal */
    _count(expressions, value) {
        let outParams = [this._getIntExprArray(expressions), GetInt(value)];
        return IntExpr._Create(this, "intCount", outParams);
    }
    /** @internal */
    _element(array, subscript) {
        let outParams = [this._getIntArray(array), GetIntExpr(subscript)];
        return IntExpr._Create(this, "intElement", outParams);
    }
    /** @internal */
    _exprElement(expressions, subscript) {
        let outParams = [this._getIntExprArray(expressions), GetIntExpr(subscript)];
        return IntExpr._Create(this, "intExprElement", outParams);
    }
    /** @internal */
    _floatIdentity(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return Constraint._Create(this, "floatIdentity", outParams);
    }
    /** @internal */
    _floatGuard(arg, absentValue = 0) {
        let outParams = [GetFloatExpr(arg), GetFloat(absentValue)];
        return FloatExpr._Create(this, "floatGuard", outParams);
    }
    /** @internal */
    _floatNeg(arg) {
        let outParams = [GetFloatExpr(arg)];
        return FloatExpr._Create(this, "floatNeg", outParams);
    }
    /** @internal */
    _floatPlus(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return FloatExpr._Create(this, "floatPlus", outParams);
    }
    /** @internal */
    _floatMinus(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return FloatExpr._Create(this, "floatMinus", outParams);
    }
    /** @internal */
    _floatTimes(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return FloatExpr._Create(this, "floatTimes", outParams);
    }
    /** @internal */
    _floatDiv(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return FloatExpr._Create(this, "floatDiv", outParams);
    }
    /** @internal */
    _floatEq(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return BoolExpr._Create(this, "floatEq", outParams);
    }
    /** @internal */
    _floatNe(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return BoolExpr._Create(this, "floatNe", outParams);
    }
    /** @internal */
    _floatLt(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return BoolExpr._Create(this, "floatLt", outParams);
    }
    /** @internal */
    _floatLe(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return BoolExpr._Create(this, "floatLe", outParams);
    }
    /** @internal */
    _floatGt(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return BoolExpr._Create(this, "floatGt", outParams);
    }
    /** @internal */
    _floatGe(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return BoolExpr._Create(this, "floatGe", outParams);
    }
    /** @internal */
    _floatInRange(arg, lb, ub) {
        let outParams = [GetFloatExpr(arg), GetFloat(lb), GetFloat(ub)];
        return BoolExpr._Create(this, "floatInRange", outParams);
    }
    /** @internal */
    _floatNotInRange(arg, lb, ub) {
        let outParams = [GetFloatExpr(arg), GetFloat(lb), GetFloat(ub)];
        return BoolExpr._Create(this, "floatNotInRange", outParams);
    }
    /** @internal */
    _floatAbs(arg) {
        let outParams = [GetFloatExpr(arg)];
        return FloatExpr._Create(this, "floatAbs", outParams);
    }
    /** @internal */
    _floatSquare(arg) {
        let outParams = [GetFloatExpr(arg)];
        return FloatExpr._Create(this, "floatSquare", outParams);
    }
    /** @internal */
    _floatMin2(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return FloatExpr._Create(this, "floatMin2", outParams);
    }
    /** @internal */
    _floatMax2(lhs, rhs) {
        let outParams = [GetFloatExpr(lhs), GetFloatExpr(rhs)];
        return FloatExpr._Create(this, "floatMax2", outParams);
    }
    /** @internal */
    _floatSum(args) {
        let outParams = [this._getFloatExprArray(args)];
        return FloatExpr._Create(this, "floatSum", outParams);
    }
    /** @internal */
    _floatMax(args) {
        let outParams = [this._getFloatExprArray(args)];
        return FloatExpr._Create(this, "floatMax", outParams);
    }
    /** @internal */
    _floatMin(args) {
        let outParams = [this._getFloatExprArray(args)];
        return FloatExpr._Create(this, "floatMin", outParams);
    }
    /** @internal */
    _floatPresentLinearExpr(coefficients, expressions, constantTerm) {
        let outParams = [this._getFloatArray(coefficients), this._getFloatExprArray(expressions), GetFloat(constantTerm)];
        return FloatExpr._Create(this, "floatPresentLinearExpr", outParams);
    }
    /** @internal */
    _floatOptionalLinearExpr(coefficients, expressions, constantTerm) {
        let outParams = [this._getFloatArray(coefficients), this._getFloatExprArray(expressions), GetFloat(constantTerm)];
        return FloatExpr._Create(this, "floatOptionalLinearExpr", outParams);
    }
    /** @internal */
    _floatElement(array, subscript) {
        let outParams = [this._getFloatArray(array), GetIntExpr(subscript)];
        return FloatExpr._Create(this, "floatElement", outParams);
    }
    /**
     * Lexicographic less than or equal constraint: `lhs` ≤ `rhs`.
     *
     * @param lhs The left-hand side array of integer expressions.
     * @param rhs The right-hand side array of integer expressions.
     *
     * @returns The lexicographic constraint.
     *
     * @remarks
     * Constrains `lhs` to be lexicographically less than or equal `rhs`.
     *
     * Both arrays must have the same length, and the length must be at least 1.
     *
     * Lexicographic ordering compares arrays element by element from the first
     * position. The comparison `lhs` ≤ `rhs` holds if and only if:
     *
     * * all elements are equal (`lhs[i] == rhs[i]` for all `i`), or
     * * there exists a position `k` where `lhs[k] < rhs[k]` and all preceding elements are equal (`lhs[i] == rhs[i]` for all `i < k`)
     *
     * Lexicographic constraints are useful for symmetry breaking. For example, when
     * you have multiple equivalent solutions that differ only in the ordering of
     * symmetric variables, adding a lexicographic constraint can eliminate redundant
     * solutions.
     *
     * @example
     *
     * ```ts
     * const model = new CP.Model();
     *
     * // Variables for a 3x3 matrix where rows should be lexicographically ordered
     * const rows = Array.from({ length: 3 }, (_, i) =>
     *   Array.from({ length: 3 }, (_, j) => model.intVar(0, 9, `x_${i}_${j}`))
     * );
     *
     * // Break row symmetry: row[0] ≤ row[1] ≤ row[2] lexicographically
     * model.lexLe(rows[0], rows[1]);
     * model.lexLe(rows[1], rows[2]);
     * ```
     *
     * @see {@link Model.lexLt}, {@link Model.lexGe}, {@link Model.lexGt} for other lexicographic comparisons.
     */
    lexLe(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        return Constraint._Create(this, "intLexLe", outParams);
    }
    /**
     * Lexicographic strictly less than constraint: `lhs` < `rhs`.
     *
     * @param lhs The left-hand side array of integer expressions.
     * @param rhs The right-hand side array of integer expressions.
     *
     * @returns The lexicographic constraint.
     *
     * @remarks
     * Constrains `lhs` to be lexicographically strictly less than `rhs`.
     *
     * Both arrays must have the same length, and the length must be at least 1.
     *
     * Lexicographic ordering compares arrays element by element from the first
     * position. The comparison `lhs` < `rhs` holds if and only if:
     * there exists a position `k` where `lhs[k] < rhs[k]` and all preceding elements are equal (`lhs[i] == rhs[i]` for all `i < k`)
     *
     * Lexicographic constraints are useful for symmetry breaking. For example, when
     * you have multiple equivalent solutions that differ only in the ordering of
     * symmetric variables, adding a lexicographic constraint can eliminate redundant
     * solutions.
     *
     * @example
     *
     * ```ts
     * const model = new CP.Model();
     *
     * // Variables for a 3x3 matrix where rows should be lexicographically ordered
     * const rows = Array.from({ length: 3 }, (_, i) =>
     *   Array.from({ length: 3 }, (_, j) => model.intVar(0, 9, `x_${i}_${j}`))
     * );
     *
     * // Break row symmetry: row[0] < row[1] < row[2] lexicographically
     * model.lexLt(rows[0], rows[1]);
     * model.lexLt(rows[1], rows[2]);
     * ```
     *
     * @see {@link Model.lexLe}, {@link Model.lexGe}, {@link Model.lexGt} for other lexicographic comparisons.
     */
    lexLt(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        return Constraint._Create(this, "intLexLt", outParams);
    }
    /**
     * Lexicographic greater than or equal constraint: `lhs` ≥ `rhs`.
     *
     * @param lhs The left-hand side array of integer expressions.
     * @param rhs The right-hand side array of integer expressions.
     *
     * @returns The lexicographic constraint.
     *
     * @remarks
     * Constrains `lhs` to be lexicographically greater than or equal `rhs`.
     *
     * Both arrays must have the same length, and the length must be at least 1.
     *
     * Lexicographic ordering compares arrays element by element from the first
     * position. The comparison `lhs` ≥ `rhs` holds if and only if:
     *
     * * all elements are equal (`lhs[i] == rhs[i]` for all `i`), or
     * * there exists a position `k` where `lhs[k] > rhs[k]` and all preceding elements are equal (`lhs[i] == rhs[i]` for all `i < k`)
     *
     * Lexicographic constraints are useful for symmetry breaking. For example, when
     * you have multiple equivalent solutions that differ only in the ordering of
     * symmetric variables, adding a lexicographic constraint can eliminate redundant
     * solutions.
     *
     * @example
     *
     * ```ts
     * const model = new CP.Model();
     *
     * // Variables for a 3x3 matrix where rows should be lexicographically ordered
     * const rows = Array.from({ length: 3 }, (_, i) =>
     *   Array.from({ length: 3 }, (_, j) => model.intVar(0, 9, `x_${i}_${j}`))
     * );
     *
     * // Break row symmetry: row[0] ≥ row[1] ≥ row[2] lexicographically
     * model.lexGe(rows[0], rows[1]);
     * model.lexGe(rows[1], rows[2]);
     * ```
     *
     * @see {@link Model.lexLe}, {@link Model.lexLt}, {@link Model.lexGt} for other lexicographic comparisons.
     */
    lexGe(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        return Constraint._Create(this, "intLexGe", outParams);
    }
    /**
     * Lexicographic strictly greater than constraint: `lhs` > `rhs`.
     *
     * @param lhs The left-hand side array of integer expressions.
     * @param rhs The right-hand side array of integer expressions.
     *
     * @returns The lexicographic constraint.
     *
     * @remarks
     * Constrains `lhs` to be lexicographically strictly greater than `rhs`.
     *
     * Both arrays must have the same length, and the length must be at least 1.
     *
     * Lexicographic ordering compares arrays element by element from the first
     * position. The comparison `lhs` > `rhs` holds if and only if:
     * there exists a position `k` where `lhs[k] > rhs[k]` and all preceding elements are equal (`lhs[i] == rhs[i]` for all `i < k`)
     *
     * Lexicographic constraints are useful for symmetry breaking. For example, when
     * you have multiple equivalent solutions that differ only in the ordering of
     * symmetric variables, adding a lexicographic constraint can eliminate redundant
     * solutions.
     *
     * @example
     *
     * ```ts
     * const model = new CP.Model();
     *
     * // Variables for a 3x3 matrix where rows should be lexicographically ordered
     * const rows = Array.from({ length: 3 }, (_, i) =>
     *   Array.from({ length: 3 }, (_, j) => model.intVar(0, 9, `x_${i}_${j}`))
     * );
     *
     * // Break row symmetry: row[0] > row[1] > row[2] lexicographically
     * model.lexGt(rows[0], rows[1]);
     * model.lexGt(rows[1], rows[2]);
     * ```
     *
     * @see {@link Model.lexLe}, {@link Model.lexLt}, {@link Model.lexGe} for other lexicographic comparisons.
     */
    lexGt(lhs, rhs) {
        let outParams = [this._getIntExprArray(lhs), this._getIntExprArray(rhs)];
        return Constraint._Create(this, "intLexGt", outParams);
    }
    /**
     * Creates an integer expression for the start time of an interval variable.
     *
     * @param interval The interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the interval is absent, the resulting expression is also absent.
     *
     * @example
     *
     * In the following example, we constrain interval variable `y` to start after the end of `x` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ name: "x", ... });
     * let y = model.intervalVar({ name: "y", ... });
     * model.enforce(model.end(x).plus(10).le(model.start(y)));
     * model.enforce(model.length(x).le(model.length(y)));
     * ```
     *
     * When `x` or `y` is *absent* then value of both constraints above is *absent* and therefore they are satisfied.
     *
     * @see {@link IntervalVar.start} is equivalent function on {@link IntervalVar}.
     */
    start(interval) {
        let outParams = [GetIntervalVar(interval)];
        return IntExpr._Create(this, "startOf", outParams);
    }
    /**
     * Creates an integer expression for the end time of an interval variable.
     *
     * @param interval The interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the interval is absent, the resulting expression is also absent.
     *
     * @example
     *
     * In the following example, we constrain interval variable `y` to start after the end of `x` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ name: "x", ... });
     * let y = model.intervalVar({ name: "y", ... });
     * model.enforce(model.end(x).plus(10).le(model.start(y)));
     * model.enforce(model.length(x).le(model.length(y)));
     * ```
     *
     * When `x` or `y` is *absent* then value of both constraints above is *absent* and therefore they are satisfied.
     *
     * @see {@link IntervalVar.end} is equivalent function on {@link IntervalVar}.
     */
    end(interval) {
        let outParams = [GetIntervalVar(interval)];
        return IntExpr._Create(this, "endOf", outParams);
    }
    /**
     * Creates an integer expression for the duration (end - start) of an interval variable.
     *
     * @param interval The interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the interval is absent, the resulting expression is also absent.
     *
     * @example
     *
     * In the following example, we constrain interval variable `y` to start after the end of `x` with a delay of at least 10. In addition, we constrain the length of `x` to be less or equal to the length of `y`.
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ name: "x", ... });
     * let y = model.intervalVar({ name: "y", ... });
     * model.enforce(model.end(x).plus(10).le(model.start(y)));
     * model.enforce(model.length(x).le(model.length(y)));
     * ```
     *
     * When `x` or `y` is *absent* then value of both constraints above is *absent* and therefore they are satisfied.
     *
     * @see {@link IntervalVar.length} is equivalent function on {@link IntervalVar}.
     */
    length(interval) {
        let outParams = [GetIntervalVar(interval)];
        return IntExpr._Create(this, "lengthOf", outParams);
    }
    /**
     * Creates an integer expression for the start time of the interval variable. If the interval is absent, then its value is `absentValue`.
     *
     * @param interval The interval variable.
     * @param absentValue The value to use when the interval is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * This function is equivalent to `startOr(interval).guard(absentValue)`.
     *
     * @see {@link Model.startOr}
     * @see {@link Model.guard}
     */
    startOr(interval, absentValue) {
        let outParams = [GetIntervalVar(interval), GetInt(absentValue)];
        return IntExpr._Create(this, "startOr", outParams);
    }
    /**
     * Creates an integer expression for the end time of the interval variable. If the interval is absent, then its value is `absentValue`.
     *
     * @param interval The interval variable.
     * @param absentValue The value to use when the interval is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * This function is equivalent to `endOr(interval).guard(absentValue)`.
     *
     * @see {@link Model.endOr}
     * @see {@link Model.guard}
     */
    endOr(interval, absentValue) {
        let outParams = [GetIntervalVar(interval), GetInt(absentValue)];
        return IntExpr._Create(this, "endOr", outParams);
    }
    /**
     * Creates an integer expression for the duration (end - start) of the interval variable. If the interval is absent, then its value is `absentValue`.
     *
     * @param interval The interval variable.
     * @param absentValue The value to use when the interval is absent.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * This function is equivalent to `lengthOr(interval).guard(absentValue)`.
     *
     * @see {@link Model.lengthOr}
     * @see {@link Model.guard}
     */
    lengthOr(interval, absentValue) {
        let outParams = [GetIntervalVar(interval), GetInt(absentValue)];
        return IntExpr._Create(this, "lengthOr", outParams);
    }
    /** @internal */
    _overlapLength(interval1, interval2) {
        let outParams = [GetIntervalVar(interval1), GetIntervalVar(interval2)];
        return IntExpr._Create(this, "overlapLength", outParams);
    }
    /** @internal */
    _alternativeCost(main, options, weights) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(options), this._getIntArray(weights)];
        return IntExpr._Create(this, "intAlternativeCost", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).le(successor.end())).
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be less than or equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.endBeforeEnd} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    endBeforeEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "endBeforeEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).le(successor.start())).
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be less than or equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.endBeforeStart} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    endBeforeStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "endBeforeStart", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).le(successor.end())).
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be less than or equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.startBeforeEnd} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    startBeforeEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "startBeforeEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).le(successor.start())).
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be less than or equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.startBeforeStart} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.le}
     */
    startBeforeStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "startBeforeStart", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).eq(successor.end())).
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.endAtEnd} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    endAtEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "endAtEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.end().plus(delay).eq(successor.start())).
     * ```
     *
     * In other words, end of `predecessor` plus `delay` must be equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.endAtStart} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    endAtStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "endAtStart", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).eq(successor.end())).
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be equal to end of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.startAtEnd} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    startAtEnd(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "startAtEnd", outParams);
    }
    /**
     * Creates a precedence constraint between two interval variables.
     *
     * @param predecessor The predecessor interval variable.
     * @param successor The successor interval variable.
     * @param delay The minimum delay between intervals.
     *
     * @returns The precedence constraint.
     *
     * @remarks
     * Same as:
     *
     * ```ts
     * model.enforce(predecessor.start().plus(delay).eq(successor.start())).
     * ```
     *
     * In other words, start of `predecessor` plus `delay` must be equal to start of `successor`.
     *
     * When one of the two interval variables is absent, then the constraint is satisfied.
     *
     * @see {@link IntervalVar.startAtStart} is equivalent function on {@link IntervalVar}.
     * @see {@link IntervalVar.start}, {@link IntervalVar.end}
     *
     * @see {@link IntExpr.eq}
     */
    startAtStart(predecessor, successor, delay = 0) {
        let outParams = [GetIntervalVar(predecessor), GetIntervalVar(successor), GetIntExpr(delay)];
        return Constraint._Create(this, "startAtStart", outParams);
    }
    /**
     * Alternative constraint models a choice between different ways to execute an interval.
     *
     * @param main The main interval variable.
     * @param options Array of optional interval variables to choose from.
     *
     * @returns The alternative constraint.
     *
     * @remarks
     * Alternative constraint is a way to model various kinds of choices. For example, we can model a task that could be done by worker A, B, or C. To model such alternative, we use interval variable `main` that represents the task regardless the chosen worker and three interval variables `options = [A, B, C]` that represent the task when done by worker A, B, or C. Interval variables `A`, `B`, and `C` should be optional. This way, if e.g. option B is chosen, then `B` will be *present* and equal to `main` (they will start at the same time and end at the same time), the remaining options, A and C, will be *absent*.
     *
     * We may also decide not to execute the `main` task at all (if it is optional). Then `main` will be *absent* and all options `A`, `B` and `C` will be *absent* too.
     *
     * ### Formal definition
     *
     * The constraint `alternative(main, options)` is satisfied in the following two cases:
     * 1. Interval `main` is *absent* and all `options[i]` are *absent* too.
     * 2. Interval `main` is *present* and exactly one of `options[i]` is *present* (the remaining options are *absent*).    Let `k` be the index of the present option.    Then `main.start() == options[k].start()` and `main.end() == options[k].end()`.
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
     */
    alternative(main, options) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(options)];
        return Constraint._Create(this, "alternative", outParams);
    }
    /** @internal */
    _intervalVarElement(slots, index, value) {
        let outParams = [this._getIntervalVarArray(slots), GetIntExpr(index), GetIntervalVar(value)];
        return Constraint._Create(this, "intervalVarElement", outParams);
    }
    /** @internal */
    _increasingIntervalVarElement(slots, index, value) {
        let outParams = [this._getIntervalVarArray(slots), GetIntExpr(index), GetIntervalVar(value)];
        return Constraint._Create(this, "increasingIntervalVarElement", outParams);
    }
    /** @internal */
    _itvMapping(tasks, slots, indices) {
        let outParams = [this._getIntervalVarArray(tasks), this._getIntervalVarArray(slots), this._getIntExprArray(indices)];
        return Constraint._Create(this, "itvMapping", outParams);
    }
    /**
     * Constrains an interval variable to span (cover) a set of other interval variables.
     *
     * @param main The spanning interval variable.
     * @param covered The set of interval variables to cover.
     *
     * @returns The span constraint.
     *
     * @remarks
     * Span constraint can be used to model, for example, a composite task that consists of several subtasks.
     *
     * The constraint makes sure that interval variable `main` starts with the first interval in `covered` and ends with the last interval in `covered`. Absent interval variables in `covered` are ignored.
     *
     * ### Formal definition
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
     * @see {@link IntervalVar.span} is equivalent function on {@link IntervalVar}.
     */
    span(main, covered) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(covered)];
        return Constraint._Create(this, "span", outParams);
    }
    /** @internal */
    _noOverlap(sequence, transitions) {
        let outParams = [GetSequenceVar(sequence)];
        if (transitions !== undefined)
            outParams.push(this._getIntMatrix(transitions));
        return Constraint._Create(this, "noOverlap", outParams);
    }
    /**
     * Creates an expression equal to the position of the `interval` on the `sequence`.
     *
     * @param interval The interval variable.
     * @param sequence The sequence variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * In the solution, the interval which is scheduled first has position 0, the second interval has position 1, etc. The position of an absent interval is `absent`.
     *
     * The `position` expression cannot be used with interval variables of possibly zero length (because the position of two simultaneous zero-length intervals would be undefined). Also, `position` cannot be used in case of {@link Model.noOverlap} constraint with transition times.
     *
     * @see {@link IntervalVar.position} is equivalent function on {@link IntervalVar}.
     * @see {@link Model.noOverlap} for constraints on overlapping intervals.
     * @see {@link Model.sequenceVar} for creating sequence variables.
     */
    position(interval, sequence) {
        let outParams = [GetIntervalVar(interval), GetSequenceVar(sequence)];
        return IntExpr._Create(this, "position", outParams);
    }
    /** @internal */
    _sameSequence(sequence1, sequence2) {
        let outParams = [GetSequenceVar(sequence1), GetSequenceVar(sequence2)];
        return Constraint._Create(this, "sameSequence", outParams);
    }
    /** @internal */
    _sameSequenceGroup(sequences) {
        let outParams = [this._getSequenceVarArray(sequences)];
        return Constraint._Create(this, "sameSequenceGroup", outParams);
    }
    /**
     * Creates cumulative function (expression) _pulse_ for the given interval variable and height.
     *
     * @param interval The interval variable.
     * @param height The height value.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Pulse can be used to model a resource requirement during an interval variable. The given amount `height` of the resource is used throughout the interval (from start to end).
     *
     * **Limitation:** The `height` must be non-negative. Pulses with negative height are not supported. If you need negative contributions, use step functions instead (see {@link Model.stepAtStart} and {@link Model.stepAtEnd}).
     *
     * ### Formal definition
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
     * Cumulative functions can be combined using {@link CumulExpr.plus}, {@link CumulExpr.minus}, {@link CumulExpr.neg} and {@link Model.sum}. A cumulative function's minimum and maximum height can be constrained using {@link CumulExpr.le} and {@link CumulExpr.ge}.
     *
     * @example
     *
     * Let us consider a set of tasks and a group of 3 workers. Each task requires a certain number of workers (`demand`). Our goal is to schedule the tasks so that the length of the schedule (makespan) is minimal.
     *
     * ```ts
     * // The input data:
     * const nbWorkers = 3;
     * const tasks = [
     *   { length: 10, demand: 3},
     *   { length: 20, demand: 2},
     *   { length: 15, demand: 1},
     *   { length: 30, demand: 2},
     *   { length: 20, demand: 1},
     *   { length: 25, demand: 2},
     *   { length: 10, demand: 1},
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
     *   pulses.push(model.pulse(task, tasks[i].demand));
     *   // Store the end of the task:
     *   ends.push(task.end());
     * }
     *
     * // The number of workers used at any time cannot exceed nbWorkers:
     * model.le(model.sum(pulses), nbWorkers);
     * // Minimize the maximum of the ends (makespan):
     * model.minimize(model.max(ends));
     *
     * let result = await model.solve({ searchType: "FDS" });
     * ```
     *
     * @example
     *
     * In the following example, we create three interval variables `x`, `y`, and `z` that represent some tasks. Variables `x` and `y` are present, but variable `z` is optional. Each task requires a certain number of workers. The length of the task depends on the assigned number of workers. The number of assigned workers is modeled using integer variables `wx`, `wy`, and `wz`.
     *
     * There are 7 workers. Therefore, at any time, the sum of the workers assigned to the running tasks must be less or equal to 7.
     *
     * If the task `z` is absent, then the variable `wz` has no meaning, and therefore, it should also be absent.
     *
     * ```ts
     * let model = CP.Model;
     * let x = model.intervalVar({ name: "x" });
     * let y = model.intervalVar({ name: "y" });
     * let z = model.intervalVar({ name: "z", optional: true });
     *
     * let wx = model.intVar({ range: [1, 5], name: "wx" });
     * let wy = model.intVar({ range: [1, 5], name: "wy" });
     * let wz = model.intVar({ range: [1, 5], name: "wz", optional: true });
     *
     * // wz is present if an only if z is present:
     * model.enforce(z.presence().eq(wz.presence()));
     *
     * let px = model.pulse(x, wx);
     * let py = model.pulse(y, wy);
     * let pz = model.pulse(z, wz);
     *
     * // There are at most 7 workers at any time:
     * model.sum([px, py, pz]).le(7);
     *
     * // Length of the task depends on the number of workers using the following formula:
     * //    length * wx = 12
     * model.enforce(x.length().times(wx).eq(12));
     * model.enforce(y.length().times(wy).eq(12));
     * model.enforce(z.length().times(wz).eq(12));
     * ```
     *
     * @see {@link IntervalVar.pulse} is equivalent function on {@link IntervalVar}.
     * @see {@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt} for other basic cumulative functions.
     * @see {@link CumulExpr.le} and {@link CumulExpr.ge} for constraints on cumulative functions.
     */
    pulse(interval, height) {
        let outParams = [GetIntervalVar(interval), GetIntExpr(height)];
        return CumulExpr._Create(this, "pulse", outParams);
    }
    /**
     * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
     *
     * @param interval The interval variable.
     * @param height The height value.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Cumulative _step_ functions could be used to model a resource that is consumed or produced and, therefore, changes in amount over time. Examples of such a resource are a battery, an account balance, a product's stock, etc.
     *
     * A `stepAtStart` can change the amount of such resource at the start of a given variable. The amount is changed by the given `height`, which can be positive or negative.
     *
     * The `height` can be a constant value or an expression. In particular, the `height` can be given by an {@link IntVar}. In such a case, the `height` is unknown at the time of the model creation but is determined during the search.
     *
     * Note that the `interval` and the `height` may have different presence statuses (when the `height` is given by a variable or an expression). In this case, the step is present only if both the `interval` and the `height` are present. Therefore, it is helpful to constrain the `height` to have the same presence status as the `interval`.
     *
     * Cumulative steps could be combined using {@link CumulExpr.plus}, {@link CumulExpr.minus}, {@link CumulExpr.neg} and {@link Model.sum}. A cumulative function's minimum and maximum height can be constrained using {@link CumulExpr.le} and {@link CumulExpr.ge}.
     *
     * ### Formal definition
     *
     * stepAtStart creates a cumulative function which has the value:
     *
     * * `0` before `interval.start()`,
     * * `height` after `interval.start()`.
     *
     * If the `interval` or the `height` is *absent*, the created cumulative function is `0` everywhere.
     *
     * @example
     *
     * Let us consider a set of tasks. Each task either costs a certain amount of money or makes some money. Money is consumed at the start of a task and produced at the end. We have an initial `budget`, and we want to schedule the tasks so that we do not run out of money (i.e., the amount is always non-negative).
     *
     * Tasks cannot overlap. Our goal is to find the shortest schedule possible.
     *
     * ```ts
     * // The input data:
     * const budget = 100;
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
     * // The initial budget increases the cumul at time 0:
     * steps.push(model.stepAt(0, budget));
     * // The money must be non-negative at any time:
     * model.ge(model.sum(steps), 0);
     * // Only one task at a time:
     * model.noOverlap(taskVars);
     *
     * // Minimize the maximum of the ends (makespan):
     * model.max(taskVars.map(t => t.end())).minimize();
     *
     * let result = await model.solve({ searchType: "FDS"});
     * ```
     *
     * @see {@link IntervalVar.stepAtStart} is equivalent function on {@link IntervalVar}.
     * @see {@link Model.stepAtEnd}, {@link Model.stepAt}, {@link Model.pulse} for other basic cumulative functions.
     * @see {@link CumulExpr.le} and {@link CumulExpr.ge} for constraints on cumulative functions.
     */
    stepAtStart(interval, height) {
        let outParams = [GetIntervalVar(interval), GetIntExpr(height)];
        return CumulExpr._Create(this, "stepAtStart", outParams);
    }
    /**
     * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
     *
     * @param interval The interval variable.
     * @param height The height value.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Cumulative _step_ functions could be used to model a resource that is consumed or produced and, therefore, changes in amount over time. Examples of such a resource are a battery, an account balance, a product's stock, etc.
     *
     * A `stepAtEnd` can change the amount of such resource at the end of a given variable. The amount is changed by the given `height`, which can be positive or negative.
     *
     * The `height` can be a constant value or an expression. In particular, the `height` can be given by an {@link IntVar}. In such a case, the `height` is unknown at the time of the model creation but is determined during the search.
     *
     * Note that the `interval` and the `height` may have different presence statuses (when the `height` is given by a variable or an expression). In this case, the step is present only if both the `interval` and the `height` are present. Therefore, it is helpful to constrain the `height` to have the same presence status as the `interval`.
     *
     * Cumulative steps could be combined using {@link CumulExpr.plus}, {@link CumulExpr.minus}, {@link CumulExpr.neg} and {@link Model.sum}. A cumulative function's minimum and maximum height can be constrained using {@link CumulExpr.le} and {@link CumulExpr.ge}.
     *
     * ### Formal definition
     *
     * stepAtEnd creates a cumulative function which has the value:
     *
     * * `0` before `interval.end()`,
     * * `height` after `interval.end()`.
     *
     * If the `interval` or the `height` is *absent*, the created cumulative function is `0` everywhere.
     *
     * @example
     *
     * Let us consider a set of tasks. Each task either costs a certain amount of money or makes some money. Money is consumed at the start of a task and produced at the end. We have an initial `budget`, and we want to schedule the tasks so that we do not run out of money (i.e., the amount is always non-negative).
     *
     * Tasks cannot overlap. Our goal is to find the shortest schedule possible.
     *
     * ```ts
     * // The input data:
     * const budget = 100;
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
     * // The initial budget increases the cumul at time 0:
     * steps.push(model.stepAt(0, budget));
     * // The money must be non-negative at any time:
     * model.ge(model.sum(steps), 0);
     * // Only one task at a time:
     * model.noOverlap(taskVars);
     *
     * // Minimize the maximum of the ends (makespan):
     * model.max(taskVars.map(t => t.end())).minimize();
     *
     * let result = await model.solve({ searchType: "FDS"});
     * ```
     *
     * @see {@link IntervalVar.stepAtEnd} is equivalent function on {@link IntervalVar}.
     * @see {@link Model.stepAtStart}, {@link Model.stepAt}, {@link Model.pulse} for other basic cumulative functions.
     * @see {@link CumulExpr.le} and {@link CumulExpr.ge} for constraints on cumulative functions.
     */
    stepAtEnd(interval, height) {
        let outParams = [GetIntervalVar(interval), GetIntExpr(height)];
        return CumulExpr._Create(this, "stepAtEnd", outParams);
    }
    /**
     * Creates a cumulative function that changes value at a given point.
     *
     * @param x The point at which the cumulative function changes value.
     * @param height The height value (can be positive, negative, constant, or expression).
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * This function is similar to {@link Model.stepAtStart} and {@link Model.stepAtEnd}, but the time of the change is given by the constant value `x` instead of by the start/end of an interval variable. The height can be a constant or an expression (e.g., created by {@link Model.intVar}).
     *
     * ### Formal definition
     *
     * `stepAt` creates a cumulative function which has the value:
     *
     * * 0 before `x`,
     * * `height` after `x`.
     *
     * @see {@link Model.stepAtStart}, {@link Model.stepAtEnd} for an example with `stepAt`.
     * @see {@link CumulExpr.le} and {@link CumulExpr.ge} for constraints on cumulative functions.
     */
    stepAt(x, height) {
        let outParams = [GetInt(x), GetIntExpr(height)];
        return CumulExpr._Create(this, "stepAt", outParams);
    }
    /** @internal */
    _cumulMaxProfile(cumul, profile) {
        let outParams = [GetCumulExpr(cumul), GetIntStepFunction(profile)];
        return Constraint._Create(this, "cumulMaxProfile", outParams);
    }
    /** @internal */
    _cumulMinProfile(cumul, profile) {
        let outParams = [GetCumulExpr(cumul), GetIntStepFunction(profile)];
        return Constraint._Create(this, "cumulMinProfile", outParams);
    }
    /** @internal */
    _cumulStairs(atoms) {
        let outParams = [this._getCumulExprArray(atoms)];
        return CumulExpr._Create(this, "cumulStairs", outParams);
    }
    /** @internal */
    _precedenceEnergyBefore(main, others, heights, capacity) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(others), this._getIntArray(heights), GetInt(capacity)];
        return Constraint._Create(this, "precedenceEnergyBefore", outParams);
    }
    /** @internal */
    _precedenceEnergyAfter(main, others, heights, capacity) {
        let outParams = [GetIntervalVar(main), this._getIntervalVarArray(others), this._getIntArray(heights), GetInt(capacity)];
        return Constraint._Create(this, "precedenceEnergyAfter", outParams);
    }
    /**
     * Computes sum of values of the step function `func` over the interval `interval`.
     *
     * @param func The step function.
     * @param interval The interval variable.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * The sum is computed over all points in range `interval.start()` .. `interval.end()-1`. The sum includes the function value at the start time but not the value at the end time. If the interval variable has zero length, then the result is 0. If the interval variable is absent, then the result is `absent`.
     *
     * **Requirement**: The step function `func` must be non-negative.
     *
     * @see {@link IntStepFunction.integral} for the equivalent function on {@link IntStepFunction}.
     */
    integral(func, interval) {
        let outParams = [GetIntStepFunction(func), GetIntervalVar(interval)];
        return IntExpr._Create(this, "intStepFunctionIntegral", outParams);
    }
    /** @internal */
    _stepFunctionIntegralInRange(func, interval, lb, ub) {
        let outParams = [GetIntStepFunction(func), GetIntervalVar(interval), GetInt(lb), GetInt(ub)];
        return Constraint._Create(this, "intStepFunctionIntegralInRange", outParams);
    }
    /**
     * Evaluates a step function at a given point.
     *
     * @param func The step function.
     * @param arg The point at which to evaluate the step function.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * The result is the value of the step function `func` at the point `arg`. If the value of `arg` is `absent`, then the result is also `absent`.
     *
     * By constraining the returned value, it is possible to limit `arg` to be only within certain segments of the segmented function. In particular, functions {@link Model.forbidStart} and {@link Model.forbidEnd} work that way.
     *
     * @see {@link IntStepFunction.eval} for the equivalent function on {@link IntStepFunction}.
     * @see {@link Model.forbidStart}, {@link Model.forbidEnd} are convenience functions built on top of `eval`.
     */
    eval(func, arg) {
        let outParams = [GetIntStepFunction(func), GetIntExpr(arg)];
        return IntExpr._Create(this, "intStepFunctionEval", outParams);
    }
    /** @internal */
    _stepFunctionEvalInRange(func, arg, lb, ub) {
        let outParams = [GetIntStepFunction(func), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        return Constraint._Create(this, "intStepFunctionEvalInRange", outParams);
    }
    /** @internal */
    _stepFunctionEvalNotInRange(func, arg, lb, ub) {
        let outParams = [GetIntStepFunction(func), GetIntExpr(arg), GetInt(lb), GetInt(ub)];
        return Constraint._Create(this, "intStepFunctionEvalNotInRange", outParams);
    }
    /**
     * Forbid the interval variable to overlap with segments of the function where the value is zero.
     *
     * @param interval The interval variable.
     * @param func The step function.
     *
     * @returns The constraint forbidding the extent (entire interval).
     *
     * @remarks
     * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero. That is, if $[s, e)$ is a segment of the step function where the value is zero, then the interval variable either ends before $s$ ($\mathtt{interval.end()} \le s$) or starts after $e$ ($e \le \mathtt{interval.start()}$).
     *
     * ## Example
     *
     * A production task that cannot overlap with scheduled maintenance windows:
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     *
     * // A 3-hour production run
     * const production = model.intervalVar({ length: 3, name: "production" });
     *
     * // Machine availability: 1 = available, 0 = under maintenance
     * const availability = model.stepFunction([
     *     [0, 1],   // Initially available
     *     [8, 0],   // 8h: maintenance starts
     *     [10, 1],  // 10h: maintenance ends
     * ]);
     *
     * // Production cannot overlap periods where availability is 0
     * model.forbidExtent(production, availability);
     * model.minimize(production.end());
     *
     * const result = await model.solve();
     * // Production runs [0, 3) - finishes before maintenance window
     * ```
     *
     * @see {@link IntervalVar.forbidExtent} for the equivalent function on {@link IntervalVar}.
     * @see {@link Model.forbidStart}, {@link Model.forbidEnd} for similar functions that constrain the start/end of an interval variable.
     * @see {@link Model.eval} for evaluation of a step function.
     */
    forbidExtent(interval, func) {
        let outParams = [GetIntervalVar(interval), GetIntStepFunction(func)];
        return Constraint._Create(this, "forbidExtent", outParams);
    }
    /**
     * Constrains the start of the interval variable to be outside of the zero-height segments of the step function.
     *
     * @param interval The interval variable.
     * @param func The step function.
     *
     * @returns The constraint forbidding the start point.
     *
     * @remarks
     * This function is equivalent to:
     *
     * ```ts
     *   model.enforce(model.ne(model.eval(func, interval.start()), 0));
     * ```
     *
     * I.e., the function value at the start of the interval variable cannot be zero.
     *
     * ## Example
     *
     * A factory task that can only start during work hours (excluding breaks):
     *
     * @see {@link IntervalVar.forbidStart} for the equivalent function on {@link IntervalVar}.
     * @see {@link Model.forbidEnd} for similar function that constrains end an interval variable.
     * @see {@link Model.eval} for evaluation of a step function.
     */
    forbidStart(interval, func) {
        let outParams = [GetIntervalVar(interval), GetIntStepFunction(func)];
        return Constraint._Create(this, "forbidStart", outParams);
    }
    /**
     * Constrains the end of the interval variable to be outside of the zero-height segments of the step function.
     *
     * @param interval The interval variable.
     * @param func The step function.
     *
     * @returns The constraint forbidding the end point.
     *
     * @remarks
     * This function is equivalent to:
     *
     * ```ts
     *   model.enforce(model.ne(model.eval(func, interval.end()), 0));
     * ```
     *
     * I.e., the function value at the end of the interval variable cannot be zero.
     *
     * ## Example
     *
     * A delivery task that must complete during business hours (not during lunch break):
     *
     * @see {@link IntervalVar.forbidEnd} for the equivalent function on {@link IntervalVar}.
     * @see {@link Model.forbidStart} for similar function that constrains start an interval variable.
     * @see {@link Model.eval} for evaluation of a step function.
     */
    forbidEnd(interval, func) {
        let outParams = [GetIntervalVar(interval), GetIntStepFunction(func)];
        return Constraint._Create(this, "forbidEnd", outParams);
    }
    /** @internal */
    _disjunctiveIsBefore(x, y) {
        let outParams = [GetIntervalVar(x), GetIntervalVar(y)];
        return BoolExpr._Create(this, "disjunctiveIsBefore", outParams);
    }
    /** @internal */
    _itvPresenceChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        return Constraint._Create(this, "itvPresenceChain", outParams);
    }
    /** @internal */
    _itvPresenceChainWithCount(intervals, count) {
        let outParams = [this._getIntervalVarArray(intervals), GetIntExpr(count)];
        return Constraint._Create(this, "itvPresenceChainWithCount", outParams);
    }
    /** @internal */
    _endBeforeStartChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        return Constraint._Create(this, "endBeforeStartChain", outParams);
    }
    /** @internal */
    _startBeforeStartChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        return Constraint._Create(this, "startBeforeStartChain", outParams);
    }
    /** @internal */
    _endBeforeEndChain(intervals) {
        let outParams = [this._getIntervalVarArray(intervals)];
        return Constraint._Create(this, "endBeforeEndChain", outParams);
    }
    /** @internal */
    _decisionPresentIntVar(variable, isLeft) {
        let outParams = [GetIntExpr(variable), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentIntVar", outParams);
    }
    /** @internal */
    _decisionAbsentIntVar(variable, isLeft) {
        let outParams = [GetIntExpr(variable), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionAbsentIntVar", outParams);
    }
    /** @internal */
    _decisionPresentIntervalVar(variable, isLeft) {
        let outParams = [GetIntervalVar(variable), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentIntervalVar", outParams);
    }
    /** @internal */
    _decisionAbsentIntervalVar(variable, isLeft) {
        let outParams = [GetIntervalVar(variable), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionAbsentIntervalVar", outParams);
    }
    /** @internal */
    _decisionPresentLE(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentLE", outParams);
    }
    /** @internal */
    _decisionOptionalGT(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalGT", outParams);
    }
    /** @internal */
    _decisionPresentGE(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentGE", outParams);
    }
    /** @internal */
    _decisionOptionalLT(variable, bound, isLeft) {
        let outParams = [GetIntExpr(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalLT", outParams);
    }
    /** @internal */
    _decisionPresentStartLE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentStartLE", outParams);
    }
    /** @internal */
    _decisionOptionalStartGT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalStartGT", outParams);
    }
    /** @internal */
    _decisionPresentStartGE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentStartGE", outParams);
    }
    /** @internal */
    _decisionOptionalStartLT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalStartLT", outParams);
    }
    /** @internal */
    _decisionPresentEndLE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentEndLE", outParams);
    }
    /** @internal */
    _decisionOptionalEndGT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalEndGT", outParams);
    }
    /** @internal */
    _decisionPresentEndGE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentEndGE", outParams);
    }
    /** @internal */
    _decisionOptionalEndLT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalEndLT", outParams);
    }
    /** @internal */
    _decisionPresentLengthLE(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionPresentLengthLE", outParams);
    }
    /** @internal */
    _decisionOptionalLengthGT(variable, bound, isLeft) {
        let outParams = [GetIntervalVar(variable), GetInt(bound), GetBool(isLeft)];
        return SearchDecision._Create(this, "decisionOptionalLengthGT", outParams);
    }
    /** @internal */
    _noGood(decisions) {
        let outParams = [this._getSearchDecisionArray(decisions)];
        return Constraint._Create(this, "noGood", outParams);
    }
    /** @internal */
    _related(x, y) {
        let outParams = [GetIntervalVar(x), GetIntervalVar(y)];
        return Directive._Create(this, "related", outParams);
    }
    /** @internal */
    _pack(load, where, sizes) {
        let outParams = [this._getIntExprArray(load), this._getIntExprArray(where), this._getIntArray(sizes)];
        return Constraint._Create(this, "pack", outParams);
    }
    /**
     * Constrain a set of interval variables not to overlap.
     *
     * @param intervals An array of interval variables or a sequence variable to constrain
     * @param transitions A 2D square array of minimum transition times between the intervals
     *
     * @returns The no-overlap constraint.
     *
     * @remarks
     * This function constrains a set of interval variables so they do not overlap.
     * That is, for each pair of interval variables `x` and `y`, one of the
     * following must hold:
     *
     * 1. Interval variable `x` or `y` is *absent*. In this case, the absent interval
     * is not scheduled (the task is not performed), so it cannot overlap
     * with any other interval. Only *optional* interval variables can be *absent*.
     * 2. Interval variable `x` is before `y`, that is, `x.end()` is less than or
     * equal to `y.start()`.
     * 3. The interval variable `y` is before `x`. That is, `y.end()` is less than or
     * equal to `x.start()`.
     *
     * The function can also take a square array `transitions` of minimum
     * transition times between the intervals. The transition time is the time
     * that must elapse between the end of the first interval and the start of the
     * second interval. The transition time cannot be negative. When transition
     * times are specified, the above conditions 2 and 3 are modified as follows:
     *
     * 2. `x.end() + transitions[i][j]` is less than or equal to `y.start()`.
     * 3. `y.end() + transitions[j][i]` is less than or equal to `x.start()`.
     *
     * Where `i` and `j` are types of `x` and `y`. When an array of intervals is passed,
     * the type of each interval is its index in the array.
     *
     * Note that minimum transition times are enforced between all pairs of
     * intervals, not only between direct neighbors.
     *
     * Instead of an array of interval variables, a {@link SequenceVar} can be passed.
     * See {@link Model.sequenceVar} for how to assign types to intervals in a sequence.
     *
     * @example
     *
     * The following example does not use transition times. For example with
     * transition times see {@link SequenceVar.noOverlap}.
     *
     * Let's consider a set of tasks that must be performed by a single machine.
     * The machine can handle only one task at a time. Each task is
     * characterized by its length and a deadline. The goal is to schedule the
     * tasks on the machine so that the number of missed deadlines is minimized.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const tasks = [
     *   { length: 10, deadline: 70 },
     *   { length: 20, deadline: 50 },
     *   { length: 15, deadline: 50 },
     *   { length: 30, deadline: 100 },
     *   { length: 20, deadline: 120 },
     *   { length: 25, deadline: 90 },
     *   { length: 30, deadline: 80 },
     *   { length: 10, deadline: 40 },
     *   { length: 20, deadline: 60 },
     *   { length: 25, deadline: 150 },
     * ];
     *
     * const model = new CP.Model();
     *
     * // An interval variable for each task:
     * const taskVars = [];
     * // A boolean expression that is true if the task is late:
     * const isLate = [];
     *
     * for (let i = 0; i < tasks.length; i++) {
     *   const task = tasks[i];
     *   const taskVar = model.intervalVar({ name: `Task${i}`, length: task.length });
     *   taskVars.push(taskVar);
     *   isLate.push(taskVar.end().ge(task.deadline));
     * }
     *
     * // Tasks cannot overlap:
     * model.noOverlap(taskVars);
     * // Minimize the number of late tasks:
     * model.minimize(model.sum(isLate));
     *
     * const result = await model.solve();
     * ```
     *
     * @see {@link SequenceVar.noOverlap} is the equivalent method on {@link SequenceVar}.
     */
    noOverlap(intervals, transitions) {
        if (Array.isArray(intervals))
            intervals = this.auxiliarySequenceVar(intervals);
        this._noOverlap(intervals, transitions);
    }
    /**
     * The name of the model.
     *
     * @remarks
     * The name is optional and primarily useful for distinguishing between different
     * models during debugging and benchmarking. When set, it helps identify the model
     * in logs and benchmark results.
     *
     * The name can be set either in the constructor or by assigning to this property.
     * Assigning overwrites any name that was previously set.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * // Set name in constructor
     * let model = new CP.Model({ name: "MySchedulingProblem" });
     * console.log(model.name);  // "MySchedulingProblem"
     *
     * // Or set name later
     * model = new CP.Model();
     * model.name = "JobShop";
     * console.log(model.name);  // "JobShop"
     * ```
     */
    get name() { return this.#name; }
    set name(value) { this.#name = value; }
    /** @internal @deprecated Use `name` property instead */
    setName(name) { this.#name = name; }
    /** @internal @deprecated Use `name` property instead */
    getName() { return this.#name; }
    /**
     * Enforces a boolean expression as a constraint in the model.
     *
     * @param constraint The constraint, boolean expression, or iterable of these to enforce in the model
     *
     * @remarks
     * This is the primary method for enforcing boolean expressions as constraints in the model.
     *
     * A constraint is satisfied if it is not `false`. In other words, a constraint is
     * satisfied if it is `true` or *absent*.
     *
     * A boolean expression that is *not* enforced as a constraint can have
     * arbitrary value in a solution (`true`, `false`, or *absent*). Once enforced
     * as a constraint, it can only be `true` or *absent* in the solution.
     *
     * **Note:** Constraint objects are automatically registered when created.
     * Passing them to `enforce()` is accepted but does nothing. For cumulative
     * constraints (`cumul <= capacity`, `cumul >= min_level`), using `enforce()` is
     * recommended for code clarity even though it's not required.
     *
     * ### Accepted argument types
     *
     * The `enforce` method accepts several types of arguments:
     *
     * 1. **BoolExpr objects**: Boolean expressions created from comparisons
     *    (e.g., `x <= 5`, `a == b`) or logical operations (e.g., `a & b`, `~c`).
     * 2. **bool values**: Python boolean constants `True` or `False`.
     * 3. **Constraint objects**: Accepted but does nothing (constraints auto-register).
     *    Use with cumulative constraints for clarity: `model.enforce(cumul <= capacity)`.
     * 4. **Iterables**: Lists, tuples, or generators of the above types.
     *
     * @example
     *
     * Basic usage with a boolean expression:
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "x" });
     *
     * // Enforce boolean expressions as constraints
     * model.enforce(x.start().ge(0));
     * model.enforce(x.end().le(100));
     * ```
     *
     * @example
     *
     * Enforcing multiple constraints at once using an iterable:
     *
     * ```ts
     * const model = new CP.Model();
     * const tasks = Array.from({ length: 5 }, (_, i) =>
     *   model.intervalVar({ length: 10, name: `task_${i}` })
     * );
     *
     * // Enforce multiple constraints at once
     * const constraints = tasks.map(task => task.start().ge(0));
     * model.enforce(constraints);
     *
     * // Or inline
     * model.enforce(tasks.map(task => task.end().le(100)));
     * ```
     *
     * @example
     *
     * Enforcing multiple boolean expressions:
     *
     * ```ts
     * const model = new CP.Model();
     * const x = model.intVar(0, 100, "x");
     * const y = model.intVar(0, 100, "y");
     *
     * // Enforce various boolean expressions
     * model.enforce([
     *     x.plus(y).le(50),      // From comparison
     *     x.ge(10),              // From comparison
     *     true,                  // Trivially satisfied constraint
     * ]);
     * ```
     *
     * @see {@link BoolExpr.enforce} for the fluent-style alternative.
     * @see {@link Model.noOverlap} for creating no-overlap constraints.
     * @see {@link Model.minimize} for creating minimization objectives.
     * @see {@link Model.maximize} for creating maximization objectives.
     */
    enforce(constraint) {
        // Quietly ignore Constraint, those are already registered
        if (IsIterable(constraint))
            for (let c of constraint) {
                if (!(c instanceof Constraint))
                    this.#model.push(GetConstraint(c));
            }
        else if (!(constraint instanceof Constraint))
            this.#model.push(GetConstraint(constraint));
    }
    /** @internal @deprecated Use `enforce` instead */
    constraint(constraint) {
        this.enforce(constraint);
    }
    /** @internal */
    _addDirective(directive) {
        this.#model.push(directive._getArg());
    }
    /** @internal */
    _addConstraint(constraint) {
        this.#model.push(constraint._getArg());
    }
    /** @internal */
    boolConst(value) {
        return BoolExpr._Create(this, "boolConst", [GetBool(value)]);
    }
    /** @internal */
    trueConst() {
        return BoolExpr._Create(this, "boolConst", [true]);
    }
    /** @internal */
    falseConst() {
        return BoolExpr._Create(this, "boolConst", [false]);
    }
    /** @internal */
    absentConst() {
        return BoolExpr._Create(this, "boolConst", []);
    }
    /** @internal */
    intConst(value) {
        return IntExpr._Create(this, "intConst", [GetInt(value)]);
    }
    /** @internal */
    floatConst(value) {
        return FloatExpr._Create(this, "floatConst", [GetFloat(value)]);
    }
    /**
     * Creates a new boolean variable and adds it to the model.
     *
     * @param params.optional If true, the variable can be absent in a solution (default false)
     * @param params.name Name for the variable (useful for debugging)
     *
     * @returns The created boolean variable.
     *
     * @remarks
     * A boolean variable represents an unknown truth value (`true` or `false`) that the
     * solver must find. Boolean variables are useful for modeling decisions, choices,
     * or logical conditions in your problem.
     *
     * By default, a boolean variable must be assigned a value (`true` or `false`) in every
     * solution. When `optional: true`, the variable can also be *absent*, meaning the
     * solution does not use the variable at all. This is useful when the variable
     * represents a decision that may not apply in all scenarios.
     *
     * Boolean variables support logical operations via methods:
     *
     * - {@link BoolExpr.not} for logical NOT
     * - {@link BoolExpr.or} for logical OR
     * - {@link BoolExpr.and} for logical AND
     *
     * @see {@link Model.intervalVar} for the primary variable type for scheduling problems.
     * @see {@link Model.intVar} for numeric decisions.
     *
     * @example
     *
     * Create boolean variables to model decisions:
     *
     * ```ts
     * let model = new CP.Model();
     * let useMachineA = model.boolVar({ name: "useMachineA" });
     * let useMachineB = model.boolVar({ name: "useMachineB" });
     *
     * // Constraint: must use at least one machine
     * model.enforce(useMachineA.or(useMachineB));
     *
     * // Constraint: cannot use both machines
     * model.enforce(useMachineA.and(useMachineB).not());
     * ```
     */
    boolVar(params = {}) {
        const x = BoolVar._Create(this);
        if (params.name)
            x.name = params.name;
        if (params.optional)
            x.optional = true;
        this.#boolVars.push(x);
        return x;
    }
    auxiliaryBoolVar(arg) {
        const params = typeof arg === 'string' ? { name: arg } : arg;
        let x = this.boolVar(params);
        x._makeAuxiliary();
        return x;
    }
    intVar(params = {}) {
        const x = IntVar._Create(this);
        if (params.name)
            x.name = params.name;
        if (params.optional)
            x.optional = true;
        if (typeof params.range === "number") {
            x.min = params.range;
            x.max = params.range;
        }
        else if (Array.isArray(params.range)) {
            if (params.range[0] !== undefined)
                x.min = params.range[0];
            if (params.range[1] !== undefined)
                x.max = params.range[1];
        }
        if (params.min !== undefined)
            x.min = params.min;
        if (params.max !== undefined)
            x.max = params.max;
        this.#intVars.push(x);
        return x;
    }
    /** @internal */
    auxiliaryIntVar(params) {
        let min = undefined;
        let max = undefined;
        if (params.range !== undefined) {
            if (typeof params.range === "number") {
                min = params.range;
                max = params.range;
            }
            else {
                min = params.range[0];
                max = params.range[1];
            }
        }
        let x = this.intVar({ optional: params.optional, name: params.name, min: min, max: max });
        x._makeAuxiliary();
        return x;
    }
    /** @internal */
    floatVar(params = {}) {
        const x = FloatVar._Create(this);
        if (params.name)
            x.name = params.name;
        if (params.optional)
            x.optional = true;
        if (params.min !== undefined)
            x.min = params.min;
        if (params.max !== undefined)
            x.max = params.max;
        this.#floatVars.push(x);
        return x;
    }
    /** @internal */
    auxiliaryFloatVar(params) {
        let x = this.floatVar(params);
        x._makeAuxiliary();
        return x;
    }
    /**
     * Creates a new interval variable and adds it to the model.
     *
     * @param params.start Fixed start time or range [min, max] (default [0, {@link IntervalMax}])
     * @param params.end Fixed end time or range [min, max] (default [0, {@link IntervalMax}])
     * @param params.length Fixed length or range [min, max] (default [0, {@link IntervalMax}])
     * @param params.optional Whether the interval is optional (default false)
     * @param params.name Name of the interval for debugging and display
     *
     * @returns The created interval variable.
     *
     * @remarks
     * An interval variable represents an unknown interval (a task, operation,
     * action) that the solver assigns a value in such a way as to satisfy all
     * constraints.  An interval variable has a start, end, and length. In a
     * solution, _start ≤ end_ and  _length = end - start_.
     *
     * The interval variable can be optional. In this case, its value in a solution
     * could be *absent*, meaning that the task/operation is not performed.
     *
     * Parameters `params.start`, `params.end`, and `params.length` can be either a
     * number or a tuple of two numbers.  If a number is given, it represents a
     * fixed value. If a tuple is given, it represents a range of possible values.
     * The default range for start, end and length is `0` to {@link IntervalMax}.
     * If a range is specified but one of the values is undefined (e.g. `start: [, 100]`)
     * then the default value is used instead (in our case `0`).
     *
     * @example
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
     * @see {@link IntervalVar}.
     */
    intervalVar(params = {}) {
        const itv = IntervalVar._Create(this);
        if (typeof params.start === "number") {
            itv.startMin = params.start;
            itv.startMax = params.start;
        }
        else if (Array.isArray(params.start)) {
            if (params.start[0] !== undefined)
                itv.startMin = params.start[0];
            if (params.start[1] !== undefined)
                itv.startMax = params.start[1];
        }
        if (typeof params.end === "number") {
            itv.endMin = params.end;
            itv.endMax = params.end;
        }
        else if (Array.isArray(params.end)) {
            if (params.end[0] !== undefined)
                itv.endMin = params.end[0];
            if (params.end[1] !== undefined)
                itv.endMax = params.end[1];
        }
        if (typeof params.length === "number") {
            itv.lengthMin = params.length;
            itv.lengthMax = params.length;
        }
        else if (Array.isArray(params.length)) {
            if (params.length[0] !== undefined)
                itv.lengthMin = params.length[0];
            if (params.length[1] !== undefined)
                itv.lengthMax = params.length[1];
        }
        if (params.optional === true)
            itv.optional = true;
        if (params.name !== undefined)
            itv.name = params.name;
        this.#intervalVars.push(itv);
        return itv;
    }
    auxiliaryIntervalVar(param) {
        const params = typeof param === 'string' ? { name: param } : param;
        let x = this.intervalVar(params);
        x._makeAuxiliary();
        return x;
    }
    /**
     * Creates a sequence variable from the provided set of interval variables.
     *
     * @param intervals Interval variables that will form the sequence in the solution
     * @param types Types of the intervals, used in particular for transition times
     * @param name Name assigned to the sequence variable
     *
     * @returns The created sequence variable
     *
     * @remarks
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
     * The length of the array `types` must be the same as the length of the array
     * `intervals`. Types should be integer numbers in the range `0` to `n-1` where `n` is the
     * number of types.
     *
     * @see {@link SequenceVar.noOverlap} for an example of sequenceVar usage with transition times.
     * @see {@link SequenceVar}.
     * @see {@link Model.noOverlap}.
     */
    sequenceVar(intervals, types, name) {
        let outParams = [this._getIntervalVarArray(intervals)];
        if (types !== undefined)
            outParams.push(this._getIntArray(types));
        const result = SequenceVar._Create(this, "sequenceVar", outParams);
        if (name !== undefined)
            result.name = name;
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
     * @param arg The argument to check for presence in the solution
     *
     * @returns A boolean expression that is true if the argument is present in the solution.
     *
     * @remarks
     * The value of the expression remains unknown until a solution is found.
     * The expression can be used in a constraint to restrict possible solutions.
     *
     * The function is equivalent to {@link IntervalVar.presence}
     * and {@link IntExpr.presence}.
     *
     * @example
     *
     * In the following example, interval variables `x` and `y` must have the same presence status.
     * I.e. they must either be both *present* or both *absent*.
     *
     * ```ts
     * const model = new CP.Model();
     *
     * let x = model.intervalVar({ name: "x", optional: true, length: 10, start: [0, 100] });
     * let y = model.intervalVar({ name: "y", optional: true, length: 10, start: [0, 100] });
     * model.enforce(model.presence(x).eq(model.presence(y)));
     * ```
     *
     * ### Simple constraints over presence
     *
     * The solver treats binary constraints over presence in a special way: it
     * uses them to better propagate other constraints over the same pairs of variables.
     * Let's extend the previous example by a constraint that `x` must end before
     * `y` starts:
     *
     * ```ts
     * let x = model.intervalVar({ name: "x", optional: true, length: 10, start: [0, 100] });
     * let y = model.intervalVar({ name: "y", optional: true, length: 10, start: [0, 100] });
     * model.enforce(model.presence(x).eq(model.presence(y)));
     * // x.end <= y.start:
     * let precedence = x.end().le(y.start());
     * model.enforce(precedence);
     * ```
     *
     * In this example, the solver sees (propagates) that the minimum start time of
     * `y` is 10 and maximum end time of `x` is 90.  Without the constraint over
     * `presence`, the solver could not propagate that because one
     * of the intervals can be *absent* and the other one *present* (and so the
     * value of `precedence` would be *absent* and the constraint would be
     * satisfied).
     *
     * To achieve good propagation, it is recommended to use binary
     * constraints over `presence` when possible. For example, multiple binary
     * constraints can be used instead of a single complicated constraint.
     */
    presence(arg) {
        if (IsIntExpr(arg))
            return BoolExpr._Create(this, "intPresenceOf", [GetSafeArg(arg)]);
        return BoolExpr._Create(this, "intervalPresenceOf", [GetIntervalVar(arg)]);
    }
    sum(args) {
        if (args.length === 0)
            return 0;
        if (args[0] instanceof CumulExpr)
            return CumulExpr._Create(this, "cumulSum", [this._getCumulExprArray(args)]);
        return IntExpr._Create(this, "intSum", [this._getIntExprArray(args)]);
    }
    plus(lhs, rhs) {
        if (lhs instanceof CumulExpr)
            return CumulExpr._Create(this, "cumulPlus", [GetCumulExpr(lhs), GetCumulExpr(rhs)]);
        return IntExpr._Create(this, "intPlus", [GetIntExpr(lhs), GetIntExpr(rhs)]);
    }
    minus(lhs, rhs) {
        if (lhs instanceof CumulExpr)
            return CumulExpr._Create(this, "cumulMinus", [GetCumulExpr(lhs), GetCumulExpr(rhs)]);
        return IntExpr._Create(this, "intMinus", [GetIntExpr(lhs), GetIntExpr(rhs)]);
    }
    le(lhs, rhs) {
        if (lhs instanceof CumulExpr)
            return Constraint._Create(this, "cumulLe", [GetCumulExpr(lhs), GetIntExpr(rhs)]);
        return BoolExpr._Create(this, "intLe", [GetIntExpr(lhs), GetIntExpr(rhs)]);
    }
    ge(lhs, rhs) {
        if (lhs instanceof CumulExpr)
            return Constraint._Create(this, "cumulGe", [GetCumulExpr(lhs), GetInt(rhs)]);
        if (rhs instanceof CumulExpr)
            return Constraint._Create(this, "cumulLe", [GetCumulExpr(rhs), GetIntExpr(lhs)]);
        return BoolExpr._Create(this, "intGe", [GetIntExpr(lhs), GetIntExpr(rhs)]);
    }
    neg(arg) {
        if (arg instanceof CumulExpr)
            return CumulExpr._Create(this, "cumulNeg", [GetCumulExpr(arg)]);
        return IntExpr._Create(this, "intNeg", [GetIntExpr(arg)]);
    }
    /** @internal @deprecated Use `Model.presence` instead. */
    presenceOf(arg) {
        return this.presence(arg);
    }
    /** @internal @deprecated Use `Model.start` isntead. */
    startOf(interval) {
        return this.start(interval);
    }
    /** @internal @deprecated Use `Model.end` instead. */
    endOf(interval) {
        return this.end(interval);
    }
    /** @internal @deprecated Use `Model.length` instead. */
    lengthOf(interval) {
        return this.length(interval);
    }
    /** @internal @deprecated Use `Model.sum` instead. */
    cumulSum(args) {
        return this.sum(args);
    }
    /** @internal @deprecated Use `Model.plus` instead. */
    cumulPlus(lhs, rhs) {
        return this.plus(lhs, rhs);
    }
    /** @internal @deprecated Use `Model.minus` instead. */
    cumulMinus(lhs, rhs) {
        return this.minus(lhs, rhs);
    }
    /** @internal @deprecated Use `Model.le` instead. */
    cumulLe(cumul, maxCapacity) {
        return this.le(cumul, maxCapacity);
    }
    /** @internal @deprecated Use `Model.ge` instead. */
    cumulGe(cumul, minCapacity) {
        return this.ge(cumul, minCapacity);
    }
    /** @internal @deprecated Use `CumulExpr.neg` instead. */
    cumulNeg(arg) {
        return this.neg(arg);
    }
    /** @internal @deprecated Use `Model.integral` instead. */
    stepFunctionSum(func, interval) {
        return this.integral(func, interval);
    }
    /** @internal @deprecated Use `Model.eval` instead. */
    stepFunctionEval(func, x) {
        return this.eval(func, x);
    }
    /**
     * Creates a minimization objective for the provided expression.
     *
     * @param expr The expression to minimize
     *
     * @returns An Objective that minimizes the expression.
     *
     * @remarks
     * Creates an {@link Objective} to minimize the given expression.
     * A model can have at most one objective. New objective replaces the old one.
     *
     * Equivalent of function {@link IntExpr.minimize}.
     *
     * @example
     *
     * In the following model, we search for a solution that minimizes the maximum
     * end of the two intervals `x` and `y`:
     *
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ length: 10, name: "x" });
     * let y = model.intervalVar({ length: 20, name: "y" });
     * model.minimize(model.max2(x.end(), y.end()));
     * let result = await model.solve();
     * ```
     *
     * @see {@link Model.maximize}.
     * @see {@link IntExpr.minimize} for fluent-style minimization.
     */
    minimize(expr) {
        let result = Objective._Create(this, "minimize", [GetIntExpr(expr)]);
        this.#objective = result._getProps();
        this.#primaryObjectiveExpr = expr;
        return result;
    }
    /**
     * Creates a maximization objective for the provided expression.
     *
     * @param expr The expression to maximize
     *
     * @returns An Objective that maximizes the expression.
     *
     * @remarks
     * Creates an {@link Objective} to maximize the given expression.
     * A model can have at most one objective. New objective replaces the old one.
     *
     * Equivalent of function {@link IntExpr.maximize}.
     *
     * @example
     *
     * In the following model, we search for a solution that maximizes
     * the length of the interval variable `x`:
     *
     * ```ts
     * let model = new CP.Model;
     * let x = model.intervalVar({ length: [10, 20], name: "x" });
     * model.maximize(x.length());
     * let result = await model.solve();
     * ```
     *
     * @see {@link Model.minimize}.
     * @see {@link IntExpr.maximize} for fluent-style maximization.
     */
    maximize(expr) {
        let result = Objective._Create(this, "maximize", [GetIntExpr(expr)]);
        this.#objective = result._getProps();
        this.#primaryObjectiveExpr = expr;
        return result;
    }
    /** @internal */
    _minimizeConsecutively(arg) {
        this.#objective = Objective._Create(this, "minimizeConsecutively", [this._getIntExprArray(arg)])._getProps();
        this.#primaryObjectiveExpr = arg[0];
    }
    /** @internal */
    _maximizeConsecutively(arg) {
        this.#objective = Objective._Create(this, "maximizeConsecutively", [this._getIntExprArray(arg)])._getProps();
        this.#primaryObjectiveExpr = arg[0];
    }
    /**
     * Creates a new integer step function.
     *
     * @param values An array of points defining the step function in the form [[x0, y0], [x1, y1], ..., [xn, yn]], where xi and yi are integers. The array must be sorted by xi
     *
     * @returns The created step function
     *
     * @remarks
     * Integer step function is a piecewise constant function defined on integer
     * values in range {@link IntVarMin} to {@link IntVarMax}.  The function is
     * defined as follows:
     *
     * * $f(x) = 0$ for $x < x_0$,
     * * $f(x) = y_i$ for $x_i \leq x < x_{i+1}$
     * * $f(x) = y_n$ for $x \geq x_n$.
     *
     * Step functions can be used in the following ways:
     *
     * * Function {@link Model.eval} evaluates the function at the given point (given as {@link IntExpr}).
     * * Function {@link Model.integral} computes a sum (integral) of the function over an {@link IntervalVar}.
     * * Constraints {@link Model.forbidStart} and {@link Model.forbidEnd} forbid the start/end of an {@link IntervalVar} to be in a zero-value interval of the function.
     * * Constraint {@link Model.forbidExtent} forbids the extent of an {@link IntervalVar} to be in a zero-value interval of the function.
     */
    stepFunction(values) {
        return IntStepFunction._CreateWithValues(this, values);
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
    _serialize(command, params, warmStart, batchResults) {
        const data = {
            ...this._toObject(params, warmStart),
            msg: command,
            batchResults: batchResults || undefined // Only include if true
        };
        let jsonModel = JSON.stringify(data);
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
            if (this.#objective.func === "minimize" || this.#objective.func === "maximize")
                primaryObjectiveArg = this.#objective.args[0];
            else {
                assert(this.#objective.func === "minimizeConsecutively" || this.#objective.func === "maximizeConsecutively");
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
                this.#primaryObjectiveExpr = IntExpr._Create(this, "reusableIntExpr", [primaryObjectiveArg]);
            }
        }
        // Find variables in the model
        for (let i = 0; i < this.#refs.length; i++) {
            let props = this.#refs[i];
            if (props.func === "boolVar")
                this.#boolVars.push(BoolVar._CreateFromJSON(this, props, i));
            else if (props.func === "intVar")
                this.#intVars.push(IntVar._CreateFromJSON(this, props, i));
            else if (props.func === "intervalVar")
                this.#intervalVars.push(IntervalVar._CreateFromJSON(this, props, i));
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
                assert(typeof item === 'number');
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
            assert(row.length === n);
            for (const item of row)
                assert(Number.isInteger(item));
        }
        let knownNode = this.#knownArrays.get(arg);
        if (knownNode !== undefined)
            return knownNode._getArg();
        let node = ArrayNode._Create(this, "matrix", [arg]);
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
        let node = ArrayNode._Create(this, "array", arg);
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
        let node = ArrayNode._Create(this, "array", nodeArgs);
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
        let node = ArrayNode._Create(this, "array", nodeArgs);
        this.#knownArrays.set(arg, node);
        return node._getArg();
    }
    /**
     * Returns a list of all interval variables in the model.
     *
     * @returns A list of all interval variables in the model
     *
     * @remarks
     * Returns a copy of the list containing all interval variables that have been
     * created in this model using {@link Model.intervalVar}.
     *
     * @see {@link Model.getIntVars}, {@link Model.getBoolVars}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const task1 = model.intervalVar({ length: 10, name: "task1" });
     * const task2 = model.intervalVar({ length: 20, name: "task2" });
     *
     * const intervals = model.getIntervalVars();
     * console.log(intervals.length);  // 2
     * for (const iv of intervals) {
     *     console.log(iv.name);  // "task1", "task2"
     * }
     * ```
     */
    getIntervalVars() {
        // Return a copy of the array to prevent the user from modifying it:
        return [...this.#intervalVars];
    }
    /**
     * Returns a list of all boolean variables in the model.
     *
     * @returns A list of all boolean variables in the model
     *
     * @remarks
     * Returns a copy of the list containing all boolean variables that have been
     * created in this model using {@link Model.boolVar}.
     *
     * @see {@link Model.getIntervalVars}, {@link Model.getIntVars}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const useMachineA = model.boolVar("use_machine_a");
     * const useMachineB = model.boolVar("use_machine_b");
     *
     * const boolVars = model.getBoolVars();
     * console.log(boolVars.length);  // 2
     * for (const bv of boolVars) {
     *     console.log(bv.name);  // "use_machine_a", "use_machine_b"
     * }
     * ```
     */
    getBoolVars() {
        return [...this.#boolVars];
    }
    /**
     * Returns a list of all integer variables in the model.
     *
     * @returns A list of all integer variables in the model
     *
     * @remarks
     * Returns a copy of the list containing all integer variables that have been
     * created in this model using {@link Model.intVar}.
     *
     * @see {@link Model.getIntervalVars}, {@link Model.getBoolVars}.
     *
     * @example
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intVar(0, 10, "x");
     * const y = model.intVar(0, 100, "y");
     *
     * const intVars = model.getIntVars();
     * console.log(intVars.length);  // 2
     * for (const iv of intVars) {
     *     console.log(iv.name);  // "x", "y"
     * }
     * ```
     */
    getIntVars() {
        return [...this.#intVars];
    }
    /**
     * Solves the model and returns the result.
     *
     * @param parameters The parameters for solving
     * @param warmStart The solution to start with
     *
     * @returns The result of the solve.
     *
     * @remarks
     * Solves the model using the OptalCP solver and returns the result. This is the
     * main entry point for solving constraint programming models.
     *
     * The solver searches for solutions that satisfy all constraints in the model.
     * If an objective was specified (using {@link Model.minimize} or
     * {@link Model.maximize}), the solver searches for optimal or near-optimal
     * solutions within the given time limit.
     *
     * The returned {@link SolveResult} contains:
     *
     * * `solution` - The best solution found, or `None` if no solution was found.
     *   Use this to query variable values via methods like `get_start()`, `get_end()`,
     *   and `get_value()`.
     * * `objective` - The objective value of the best solution (if an objective
     *   was specified).
     * * `nb_solutions` - The total number of solutions found during the search.
     * * `proof` - Whether the solver proved optimality or infeasibility.
     * * `duration` - The total time spent solving.
     * * Statistics like `nb_branches`, `nb_fails`, and `nb_restarts`.
     *
     * When an error occurs (e.g., invalid model, solver not found), the function
     * raises an exception.
     *
     * ### Parameters
     *
     * Solver behavior can be controlled via the `parameters` argument. Common parameters
     * include:
     *
     * * `timeLimit` - Maximum solving time in seconds.
     * * `solutionLimit` - Stop after finding this many solutions.
     * * `nbWorkers` - Number of parallel threads to use.
     * * `searchType` - Search strategy (`"LNS"`, `"FDS"`, etc.).
     *
     * See {@link Parameters} for the complete list.
     *
     * ### Warm start
     *
     * If the `warm_start` parameter is specified, the solver will start with the
     * given solution. The solution must be compatible with the model; otherwise,
     * an error will be raised. The solver will take advantage of the
     * solution to speed up the search: it will search only for better solutions
     * (if it is a minimization or maximization problem). The solver may also try to
     * improve the provided solution by Large Neighborhood Search.
     *
     * ### Advanced usage
     *
     * This is a simple blocking function for basic usage. For advanced features
     * like event callbacks, progress monitoring, or async support, use the
     * {@link Solver} class instead.
     *
     * This method works seamlessly in both regular Python scripts and Jupyter
     * notebooks. In Jupyter (where an event loop is already running), it
     * automatically handles nested event loops.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "task_x" });
     * const y = model.intervalVar({ length: 20, name: "task_y" });
     * x.endBeforeStart(y);
     * model.minimize(y.end());
     *
     * // Basic solve
     * let result = await model.solve();
     * console.log(`Objective: ${result.objective}`);
     *
     * // Solve with parameters
     * const params = { timeLimit: 60, searchType: "LNS" };
     * result = await model.solve(params);
     *
     * // Solve with warm start
     * if (result.solution) {
     *   const result2 = await model.solve(params, result.solution);
     * }
     * ```
     *
     * @see {@link Solver} for async solving with event callbacks.
     * @see {@link Parameters} for available solver parameters.
     * @see {@link SolveResult} for the result structure.
     * @see {@link Solution} for working with solutions.
     *
     * @category Solving
     */
    async solve(parameters, warmStart) {
        let solver = new Solver();
        return solver.solve(this, parameters, warmStart);
    }
    /**
     * Exports the model to JSON format.
     *
     * @param parameters Optional solver parameters to include
     * @param warmStart Optional initial solution to include
     *
     * @returns A string containing the model in JSON format.
     *
     * @remarks
     * The result can be stored in a file for later use. The model can be
     * converted back from JSON format using {@link Model.fromJSON}.
     *
     * ```ts
     * import * as CP from "optalcp";
     * import * as fs from "fs";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "task_x" });
     * const y = model.intervalVar({ length: 20, name: "task_y" });
     * x.endBeforeStart(y);
     * model.minimize(y.end());
     *
     * // Export to JSON
     * const jsonStr = model.toJSON();
     *
     * // Save to file
     * fs.writeFileSync("model.json", jsonStr);
     *
     * // Later, load from JSON
     * const { model: model2, parameters: params2, warmStart: warmStart2 } =
     *   CP.Model.fromJSON(jsonStr);
     * ```
     *
     * @see {@link Model.fromJSON} to import from JSON.
     * @see {@link Model.toText} to export as text format.
     * @see {@link Model.toJS} to export as JavaScript code.
     *
     * @category Model exporting
     */
    toJSON(parameters, warmStart) {
        return JSON.stringify(this._toObject(parameters, warmStart));
    }
    /**
     * Creates a model from JSON format.
     *
     * @param jsonStr A string containing the model in JSON format
     *
     * @returns A tuple containing the model, optional parameters, and optional warm start solution.
     *
     * @remarks
     * Creates a new Model instance from a JSON string that was previously
     * exported using {@link Model.toJSON}.
     *
     * The method returns a tuple with three elements:
     * 1. The reconstructed Model
     * 2. Parameters (if they were included in the JSON), or None
     * 3. Warm start Solution (if it was included in the JSON), or None
     *
     * Variables in the new model can be accessed using methods like
     * {@link Model.getIntervalVars}, {@link Model.getIntVars}, etc.
     *
     * ```ts
     * import * as CP from "optalcp";
     * import * as fs from "fs";
     *
     * // Create and export a model
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "task_x" });
     * model.minimize(x.end());
     *
     * const params: CP.Parameters = { timeLimit: 60 };
     * const jsonStr = model.toJSON(params);
     *
     * // Save to file
     * fs.writeFileSync("model.json", jsonStr);
     *
     * // Later, load from file
     * const loadedJson = fs.readFileSync("model.json", "utf-8");
     *
     * // Restore model (returns Model directly in TypeScript)
     * const model2 = CP.Model.fromJSON(loadedJson);
     *
     * // Access variables
     * const intervalVars = model2.getIntervalVars();
     * console.log(`Loaded model with ${intervalVars.length} interval variables`);
     *
     * // Solve with restored parameters
     * const result = await model2.solve(params);
     * ```
     *
     * @see {@link Model.toJSON} to export to JSON.
     *
     * @category Model exporting
     */
    static fromJSON(jsonStr) {
        let data = JSON.parse(jsonStr);
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
    /**
     * Converts the model to equivalent JavaScript code.
     *
     * @param parameters Optional solver parameters (included in generated code)
     * @param warmStart Optional initial solution to include
     *
     * @returns JavaScript code representing the model.
     *
     * @remarks
     * The output is human-readable, executable with Node.js, and can be stored
     * in a file. It is meant as a way to export a model to a format that is
     * executable, human-readable, editable, and independent of other libraries.
     *
     * This feature is experimental and the result is not guaranteed to be valid
     * in all cases.
     *
     * ```ts
     * import * as CP from "optalcp";
     * import * as fs from "fs";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "task_x" });
     * const y = model.intervalVar({ length: 20, name: "task_y" });
     * x.endBeforeStart(y);
     * model.minimize(y.end());
     *
     * // Convert to JavaScript code
     * const jsCode = model.toJS();
     * console.log(jsCode);
     *
     * // Save to file
     * fs.writeFileSync("model.js", jsCode);
     * ```
     *
     * @see {@link Model.toText} to export as text format.
     * @see {@link Model.toJSON} to export as JSON (can be imported back).
     *
     * @category Model exporting
     */
    toJS(parameters, warmStart) {
        return _toText(this, "toJS", parameters, warmStart);
    }
    /**
     * Converts the model to text format similar to IBM CP Optimizer file format.
     *
     * @param parameters Optional solver parameters (mostly unused)
     * @param warmStart Optional initial solution to include
     *
     * @returns Text representation of the model.
     *
     * @remarks
     * The output is human-readable and can be stored in a file. Unlike JSON format,
     * there is no way to convert the text format back into a Model.
     *
     * The result is so similar to the file format used by IBM CP Optimizer that,
     * under some circumstances, the result can be used as an input file for
     * CP Optimizer. However, some differences between OptalCP and CP Optimizer
     * make it impossible to guarantee the result is always valid for CP Optimizer.
     *
     * Known issues:
     *
     * * OptalCP supports optional integer expressions, while CP Optimizer does not.
     *   If the model contains optional integer expressions, the result will not be
     *   valid for CP Optimizer or may be badly interpreted. For example, to get
     *   a valid CP Optimizer file, don't use `interval.start()`, use
     *   `interval.start_or(default)` instead.
     * * For the same reason, prefer precedence constraints such as
     *   `end_before_start()` over `model.enforce(x.end() <= y.start())`.
     * * Negative heights in cumulative expressions (e.g., in `step_at_start()`)
     *   are not supported by CP Optimizer.
     *
     * ```ts
     * import * as CP from "optalcp";
     * import * as fs from "fs";
     *
     * const model = new CP.Model();
     * const x = model.intervalVar({ length: 10, name: "task_x" });
     * const y = model.intervalVar({ length: 20, name: "task_y" });
     * x.endBeforeStart(y);
     * model.minimize(y.end());
     *
     * // Convert to text format
     * const text = model.toText();
     * console.log(text);
     *
     * // Save to file
     * fs.writeFileSync("model.txt", text);
     * ```
     *
     * @see {@link Model.toJS} to export as JavaScript code.
     * @see {@link Model.toJSON} to export as JSON (can be imported back).
     *
     * @category Model exporting
     */
    toText(parameters, warmStart) {
        return _toText(this, "toText", parameters, warmStart);
    }
}
/**
 * @remarks
 * The solver provides asynchronous communication with the solver.
 *
 * Unlike function {@link Model.solve}, `Solver` allows the user to process individual events
 * during the solve and to stop the solver at any time.  If you're
 * interested in the final result only, use {@link Model.solve} instead.
 *
 * To solve a model, create a new `Solver` object and call its method {@link Solver.solve}.
 *
 * Solver inherits from `EventEmitter` class from Node.js.  You can subscribe to
 * events using the standard Node.js `on` method.  The following events are
 * emitted:
 * * `error`: Emits an instance of `Error` (standard Node.js class) when an error occurs.
 * * `warning`: Emits a `string` for every issued warning.
 * * `log`: Emits a `string` for every log message.
 * * `trace`: Emits a `string` for every trace message.
 * * `solution`: Emits a {@link SolutionEvent} when a solution is found.
 * * `objectiveBound`: Emits a {@link ObjectiveBoundEntry} when a new lower bound is proved.
 * * `summary`: Emits {@link SolveSummary} at the end of the solve.
 * * `close`: Emits `void`. It is always the last event emitted.
 *
 * The solver output (log, trace, and warnings) is printed on the console by default.
 * It can be redirected to a file or a stream, or suppressed completely using the
 * {@link Parameters.printLog} parameter.
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
 * @category Solving
 */
export class Solver {
    // === Process state (reset by _resetProcessState at end of _run) ===
    #connection;
    #closeExpected = false;
    #started = false;
    #handshakeReceived = false;
    // === Promise fields for start/close synchronization ===
    #startPromise = Promise.resolve();
    #startResolve = () => { };
    #closedPromise;
    #closedResolve;
    #closedReject;
    // === Result state (reset by _resetResultState after extracting results) ===
    #summary = undefined;
    #objectiveHistory = [];
    #objectiveBoundHistory = [];
    #solution = undefined;
    #solutionTime = undefined;
    #boundTime = undefined;
    #solutionValid = undefined;
    #errorMessages = [];
    // === User configuration (never reset, preserved across multiple solves) ===
    #hasColors = false;
    #outputStream = null;
    // User can pipe the output into `less` command. And the just quit less.
    // In this case we want to stop ASAP.
    #outputStreamErrorCallback = () => {
        void this.stop("Error in output stream");
    };
    // === Solve state (prevents concurrent solves and callback changes during solve) ===
    #solving = false;
    // === Private callback fields (with public getters/setters that check #solving) ===
    #onSolution;
    #onObjectiveBound;
    #onSummary;
    #onLog;
    #onWarning;
    #onError;
    // === Public callback properties (persist across solves) ===
    /**
     * Callback for solution events from the solver.
     *
     * @remarks
     * The callback is called each time the solver finds a new solution. The default is no callback.
     *
     * The callback receives one argument:
     *
     * - `event` ({@link SolutionEvent}): An object with the following fields:
     *    - `solution` ({@link Solution}): The solution object with variable values.
     *    - `solveTime` (`number`): Time when the solution was found (seconds since solve start).
     *    - `valid` (`boolean | undefined`): Solution verification result if enabled, `undefined` otherwise.
     *
     * The callback can be either synchronous or asynchronous. If the callback raises an exception, the solve is aborted with that error.
     *
     * **Note:** This property cannot be changed while a solve is in progress. Attempting to set it during an active solve raises an error.
     *
     * ```ts
     * const solver = new CP.Solver();
     *
     * solver.onSolution = (event: CP.SolutionEvent) => {
     *   const sol = event.solution;
     *   const time = event.solveTime;
     *   console.log(`Solution found at ${time.toFixed(2)}s, objective=${sol.getObjective()}`);
     * };
     *
     * // Asynchronous callback
     * solver.onSolution = async (event: CP.SolutionEvent) => {
     *   const sol = event.solution;
     *   await saveToDatabase(sol);
     * };
     * ```
     *
     * @see {@link SolutionEvent} for the event structure.
     * @see {@link Solution} for accessing variable values.
     * @see {@link Solver.onObjectiveBound} for objective bound updates.
     */
    get onSolution() { return this.#onSolution; }
    set onSolution(handler) {
        if (this.#solving)
            throw new Error("Cannot change onSolution while solve is running");
        this.#onSolution = handler;
    }
    /**
     * Callback for objective bound events from the solver.
     *
     * @remarks
     * The callback is called when the solver improves the bound on the objective (lower bound for minimization, upper bound for maximization). The default is no callback.
     *
     * The callback receives one argument:
     *
     * - `event` ({@link ObjectiveBoundEntry}): An object with the following fields:
     *    - `value` (`number`): The new bound value.
     *    - `solveTime` (`number`): Time when the bound was proved (seconds since solve start).
     *
     * The callback can be either synchronous or asynchronous. If the callback raises an exception, the solve is aborted with that error.
     *
     * **Note:** This property cannot be changed while a solve is in progress. Attempting to set it during an active solve raises an error.
     *
     * ```ts
     * const solver = new CP.Solver();
     *
     * // Synchronous callback
     * solver.onObjectiveBound = (event) => console.log(`Bound: ${event.value}`);
     *
     * // Asynchronous callback
     * solver.onObjectiveBound = async (event: CP.ObjectiveBoundEntry) => {
     *   await updateDashboard(event.value);
     * };
     * ```
     *
     * @see {@link ObjectiveBoundEntry} for the event structure.
     * @see {@link Solver.onSolution} for solution events with objective values.
     */
    get onObjectiveBound() { return this.#onObjectiveBound; }
    set onObjectiveBound(handler) {
        if (this.#solving)
            throw new Error("Cannot change onObjectiveBound while solve is running");
        this.#onObjectiveBound = handler;
    }
    /**
     * Callback for solve completion event.
     *
     * @remarks
     * The callback is called once when the solve completes, providing final statistics. The default is no callback.
     *
     * The callback receives one argument:
     *
     * - `summary` ({@link SolveSummary}): Solve statistics with properties including:
     *    - `nbSolutions` (`number`): Number of solutions found.
     *    - `duration` (`number`): Total solve time in seconds.
     *    - `nbBranches` (`number`): Number of branches explored.
     *    - `objective` (`number | undefined`): Best objective value, or `undefined` if no solution found.
     *    - Plus many other statistics (see {@link SolveSummary}).
     *
     * The callback can be either synchronous or asynchronous. If the callback raises an exception, the solve is aborted with that error.
     *
     * **Note:** This property cannot be changed while a solve is in progress. Attempting to set it during an active solve raises an error.
     *
     * ```ts
     * const solver = new CP.Solver();
     *
     * solver.onSummary = (summary: CP.SolveSummary) => {
     *   console.log(`Solve completed: ${summary.nbSolutions} solutions`);
     *   console.log(`Time: ${summary.duration.toFixed(2)}s`);
     *   if (summary.objective !== undefined)
     *     console.log(`Best objective: ${summary.objective}`);
     * };
     *
     * // Asynchronous callback
     * solver.onSummary = async (summary: CP.SolveSummary) => {
     *   await saveStatsToDb(summary);
     * };
     * ```
     *
     * @see {@link SolveSummary} for the complete list of statistics.
     */
    get onSummary() { return this.#onSummary; }
    set onSummary(handler) {
        if (this.#solving)
            throw new Error("Cannot change onSummary while solve is running");
        this.#onSummary = handler;
    }
    /**
     * Callback for log messages from the solver.
     *
     * @remarks
     * The callback is called for each log message, after the message is written to the output stream (see {@link Parameters.printLog}). The default is no callback.
     *
     * The callback receives one argument:
     *
     * - `msg` (`string`): The log message text.
     *
     * The callback can be either synchronous or asynchronous. If the callback raises an exception, the solve is aborted with that error.
     *
     * **Note:** This property cannot be changed while a solve is in progress. Attempting to set it during an active solve raises an error.
     *
     * ```ts
     * const solver = new CP.Solver();
     *
     * // Synchronous callback
     * solver.onLog = (msg) => myLogger.info(msg);
     *
     * // Or with a named function
     * solver.onLog = (msg: string) => {
     *   console.log(`LOG: ${msg}`);
     * };
     *
     * // Asynchronous callback
     * solver.onLog = async (msg: string) => {
     *   await asyncLogger.info(msg);
     * };
     * ```
     *
     * The amount of log messages and their periodicity can be controlled by {@link Parameters.logLevel} and {@link Parameters.logPeriod}.
     *
     * @see {@link Parameters.printLog} for redirecting output to a stream.
     * @see {@link Solver.onWarning} for warning messages.
     */
    get onLog() { return this.#onLog; }
    set onLog(handler) {
        if (this.#solving)
            throw new Error("Cannot change onLog while solve is running");
        this.#onLog = handler;
    }
    /**
     * Callback for warning messages from the solver.
     *
     * @remarks
     * The callback is called for each warning message, after the message is written to the output stream (see {@link Parameters.printLog}). The default is no callback.
     *
     * The callback receives one argument:
     *
     * - `msg` (`string`): The warning message text.
     *
     * The callback can be either synchronous or asynchronous. If the callback raises an exception, the solve is aborted with that error.
     *
     * **Note:** This property cannot be changed while a solve is in progress. Attempting to set it during an active solve raises an error.
     *
     * ```ts
     * const solver = new CP.Solver();
     *
     * // Synchronous callback
     * solver.onWarning = (msg) => console.warn(msg);
     *
     * // Asynchronous callback
     * solver.onWarning = async (msg: string) => {
     *   await asyncLogger.warning(msg);
     * };
     * ```
     *
     * The amount of warning messages can be configured using {@link Parameters.warningLevel}.
     *
     * @see {@link Parameters.printLog} for redirecting output to a stream.
     * @see {@link Solver.onLog} for log messages.
     * @see {@link Solver.onError} for error messages.
     */
    get onWarning() { return this.#onWarning; }
    set onWarning(handler) {
        if (this.#solving)
            throw new Error("Cannot change onWarning while solve is running");
        this.#onWarning = handler;
    }
    /**
     * Callback for error messages from the solver.
     *
     * @remarks
     * The callback is called for each error message. The default is no callback.
     *
     * The callback receives one argument:
     *
     * - `msg` (`string`): The error message text.
     *
     * The callback can be either synchronous or asynchronous. If the callback raises an exception, the solve is aborted with that error.
     *
     * **Note:** This property cannot be changed while a solve is in progress. Attempting to set it during an active solve raises an error.
     *
     * ```ts
     * const solver = new CP.Solver();
     *
     * // Synchronous callback
     * solver.onError = (msg) => console.error(`ERROR: ${msg}`);
     *
     * // Asynchronous callback
     * solver.onError = async (msg: string) => {
     *   await asyncLogger.error(msg);
     * };
     * ```
     *
     * An error message indicates that the solve is closing. However, other messages (log, warning, solution) may still arrive after the error.
     *
     * @see {@link Solver.onWarning} for warning messages.
     * @see {@link Solver.onLog} for log messages.
     */
    get onError() { return this.#onError; }
    set onError(handler) {
        if (this.#solving)
            throw new Error("Cannot change onError while solve is running");
        this.#onError = handler;
    }
    // === Internal callbacks (for propagate/toText, persist across solves) ===
    /** @internal */
    _onStart;
    /** @internal */
    _onClose;
    /** @internal */
    _onDomains;
    /** @internal */
    _onTextModel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event, listener) {
        const propertyMap = {
            'solution': 'onSolution',
            'objectiveBound': 'onObjectiveBound',
            'lowerBound': 'onObjectiveBound', // deprecated alias
            'summary': 'onSummary',
            'log': 'onLog',
            'warning': 'onWarning',
            'error': 'onError',
        };
        const propName = propertyMap[event];
        if (propName === undefined)
            throw new Error(`Unknown event: '${event}'`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (this[propName] !== undefined)
            throw new Error(`Callback for '${event}' is already set. Use callback properties instead.`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this[propName] = listener;
        return this;
    }
    /**
     * Invoke a user callback (sync or async). Not awaited by callers (use `void`).
     * Treating errors is tricky:
     *  - If the callback is sync and throws, we catch it immeidiately.
     *    (we can await a sync function, it just returns a resolved promise)
     *  - If the callback is async and rejects, we catch it too (after await).
     *  - In case or error, we call #handleError which rejects #closedPromise.
     *  - So Model.solve (or other top-function) will get that error and finishes.
     */
    async #callCallback(callback, arg) {
        if (callback === undefined)
            return;
        try {
            await callback(arg);
        }
        catch (err) {
            this.#handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }
    /**
     * Handle a solver error message. Calls onError callback and stores for later.
     * Accumulated errors are thrown at the end of solve (if another Error is not thrown first).
     */
    #handleSolverError(msg) {
        this.#closeExpected = true;
        void this.#callCallback(this.onError, msg);
        this.#errorMessages.push(msg);
    }
    /**
     * Handle a critical error (not error reported by the solver).
     * Callback onError is called, however error it are ignored.
     * */
    #handleError(err) {
        this.#closeExpected = true;
        // Fire-and-forget onError callback with full error suppression.
        // We can't just use `void this.onError?.(err.message)` because:
        // - Sync throw would propagate up and crash the caller
        // - Async rejection would cause "unhandled promise rejection" in Node.js
        // Errors must be suppressed to prevent recursion (onError error -> #handleError -> onError...).
        try {
            const result = this.onError?.(err.message);
            if (result instanceof Promise)
                result.catch(() => { });
        }
        catch {
            // Ignore
        }
        this.#closedReject(err);
    }
    /**
     * Solves a model with the specified parameters.
     *
     * @param model The model to solve
     * @param params The parameters for the solver
     * @param warmStart An initial solution to start the solver with
     *
     * @returns The result of the solve when finished.
     *
     * @remarks
     * The solving process runs asynchronously. Use `await` to wait for the
     * solver to finish.  During the solve, the solver emits events that can be
     * intercepted using callback properties like {@link Solver.onSolution},
     * {@link Solver.onLog}, etc.
     *
     * Communication with the solver subprocess happens through the event loop.
     * The user code must yield control (using `await` or waiting for an event)
     * for the solver to receive commands and send updates.
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
     * parameter and using function {@link Solver.sendSolution}.
     * The difference is that `warmStart` is guaranteed to be used by the solver
     * before the solve starts.  On the other hand, `sendSolution` can be called
     * at any time during the solve.
     *
     * Parameter {@link Parameters.lnsUseWarmStartOnly} controls whether the
     * solver should only use the warm start solution (and not search for other
     * initial solutions). If no warm start is provided, the solver searches for
     * its own initial solution as usual.
     */
    async solve(model, params, warmStart) {
        if (this.#solving)
            throw new Error("Solver is already running. Create a new Solver instance for concurrent solves.");
        this.#solving = true;
        try {
            await this._run("solve", model, params, warmStart);
            if (this.#summary === undefined)
                throw Error("Internal error: 'summary' event was not received");
            return {
                // For some reason, typescript doesn't see that `summary` event can
                // overwrite `summary` variable.  It thinks that summary must be undefined.
                // So the following "as SolveSummary" is needed:
                ...this.#summary,
                objectiveHistory: this.#objectiveHistory,
                solution: this.#solution,
                solutionTime: this.#solutionTime,
                boundTime: this.#boundTime,
                solutionValid: this.#solutionValid,
                objectiveBoundHistory: this.#objectiveBoundHistory,
                // Deprecated fields (copies of the ones above):
                bestSolution: this.#solution,
                bestSolutionTime: this.#solutionTime,
                bestLBTime: this.#boundTime,
                bestSolutionValid: this.#solutionValid,
                lowerBoundHistory: this.#objectiveBoundHistory,
            };
            // TODO:1 `CP.solve` now returns a broken promise rather then returning a summary with `error: true`.
            //        Therefore we actually don't need "close" event. In normal case the last event could be "summary",
            //        in error case it should be "error".
            //        It assumes changes in the solver itself. In particular, in case of error, the solver should
            //        send "error" message and end immediately (so that the "error" message is the last one).
        }
        finally {
            this.#solving = false;
            this._resetState();
        }
    }
    /** @internal */
    async _run(command, model, params, warmStart) {
        if (params === undefined)
            params = {};
        // Initialize promises for start/close synchronization
        this.#startPromise = new Promise(resolve => { this.#startResolve = resolve; });
        this.#closedPromise = new Promise((resolve, reject) => {
            this.#closedResolve = resolve;
            this.#closedReject = reject;
        });
        // Configure output based on params.printLog
        const log = params.printLog;
        if (log === true) {
            this.#outputStream = { write: (s) => console.log(s.trimEnd()) };
            this.#hasColors = false;
        }
        else {
            this.#outputStream = null;
            this.#hasColors = false;
        }
        // Set up connection handlers
        const handlers = {
            onMessage: (line) => this.#processMessage(line),
            onClose: () => {
                if (!this.#closeExpected)
                    this.#handleError(new Error('Solver connection closed unexpectedly.'));
                // Defer to allow error handlers to process first
                queueMicrotask(() => {
                    this._onClose?.();
                    this.#closedResolve();
                    this._resetProcessState();
                });
            },
            onError: (err) => this.#handleError(err),
            onWarning: (msg) => {
                void this.#callCallback(this.onWarning, msg);
                if (this.#outputStream !== null)
                    this.#outputStream.write(msg + '\n');
            }
        };
        try {
            // Create connection based on platform and parameters
            const solver = params?.solver;
            if (!solver || !isWebSocketUrl(solver))
                throw new Error('solver parameter with WebSocket URL is required in browser');
            this.#connection = new WebSocketSolverConnection(solver, handlers);
            // Send handshake and model. Server processes them in order.
            // Handshake response is validated in #processMessage.
            this.#connection.send(JSON.stringify({ msg: "handshake", client: "OptalCP extension", version: Version, colors: this.#hasColors }));
            // Batch results if no incremental callbacks are set (optimization to eliminate incremental messages)
            const batchResults = command === "solve" && this.#onSolution === undefined && this.#onObjectiveBound === undefined;
            this.#connection.send(model._serialize(command, params, warmStart, batchResults));
            this.#started = true;
            this._onStart?.();
            this.#startResolve();
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown exception while starting solver.");
            this.#handleError(error);
        }
        await this.#runLoop();
    }
    /**
     * Process a message line from the solver.
     * The first message must be the handshake response.
     * @internal
     */
    #processMessage(line) {
        try {
            const msg = JSON.parse(line);
            if (typeof msg !== 'object' || msg.msg === undefined)
                throw Error("Error: Not a message.");
            // First message must be handshake response
            if (!this.#handshakeReceived) {
                if (msg.msg === 'error')
                    throw Error(msg.data);
                if (msg.msg !== 'handshake')
                    throw Error("Expected handshake message, got '" + msg.msg + "'.");
                this.#handshakeReceived = true;
                return;
            }
            switch (msg.msg) {
                case 'error':
                    if (this.#outputStream !== null)
                        this.#outputStream?.write(msg.prefix + msg.data);
                    this.#handleSolverError(msg.data);
                    break;
                case 'log':
                    if (this.#outputStream !== null)
                        this.#outputStream.write(msg.data);
                    void this.#callCallback(this.onLog, msg.data);
                    break;
                case 'warning':
                    void this.#callCallback(this.onWarning, msg.data);
                    if (this.#outputStream !== null) {
                        // msg.prefix contains possibly colored prefix "Warning: ".
                        this.#outputStream?.write(msg.prefix + msg.data);
                    }
                    break;
                case 'solution':
                    // Track solution metadata and add to objective history
                    // (Only received when batchResults=false; otherwise history comes in summary)
                    this.#solutionTime = msg.data.solveTime;
                    this.#solutionValid = msg.data.verifiedOK;
                    this.#objectiveHistory.push({
                        solveTime: msg.data.solveTime,
                        objective: msg.data.objective,
                        valid: msg.data.verifiedOK
                    });
                    if (msg.data.values !== undefined) {
                        const solution = new Solution;
                        solution._init(msg.data);
                        this.#solution = solution;
                        void this.#callCallback(this.onSolution, { solveTime: msg.data.solveTime, valid: msg.data.verifiedOK, solution: solution });
                    }
                    break;
                case 'domains':
                    // Event 'domains' is sent after propagate(). After this event the solver exits automatically:
                    // TODO:1 Make sure that solver never sends domains event with error=true.
                    this.#closeExpected = true;
                    if (!msg.data.error)
                        this._onDomains?.(msg.data);
                    break;
                case 'lowerBound':
                    this.#objectiveBoundHistory.push(msg.data);
                    this.#boundTime = msg.data.solveTime;
                    void this.#callCallback(this.onObjectiveBound, msg.data);
                    break;
                case 'textModel':
                    this.#closeExpected = true;
                    this._onTextModel?.(msg.data);
                    break;
                case 'summary':
                    this.#closeExpected = true;
                    this.#summary = {
                        ...msg.data,
                        actualWorkers: msg.data.nbWorkers,
                        objectiveBound: msg.data.lowerBound
                    };
                    // Handle batched results (when batchResults was true)
                    if (msg.data.objectiveHistory !== undefined) {
                        this.#objectiveHistory = msg.data.objectiveHistory.map((e) => ({ solveTime: e.solveTime, objective: e.objective, valid: e.verifiedOK }));
                        // Set fields from the last entry (normally set by solution messages)
                        if (this.#objectiveHistory.length > 0) {
                            const lastEntry = this.#objectiveHistory[this.#objectiveHistory.length - 1];
                            this.#solutionTime = lastEntry.solveTime;
                            this.#solutionValid = lastEntry.valid;
                        }
                    }
                    if (msg.data.objectiveBoundHistory !== undefined) {
                        this.#objectiveBoundHistory = msg.data.objectiveBoundHistory;
                        // Set #boundTime from the last entry (normally set by lowerBound messages)
                        if (this.#objectiveBoundHistory.length > 0)
                            this.#boundTime = this.#objectiveBoundHistory[this.#objectiveBoundHistory.length - 1].solveTime;
                    }
                    if (msg.data.solutionValues !== undefined) {
                        if (this.#solution === undefined)
                            this.#solution = new Solution();
                        this.#solution._init({
                            values: msg.data.solutionValues,
                            objective: msg.data.objective
                        });
                    }
                    if (!msg.data.error)
                        void this.#callCallback(this.onSummary, this.#summary);
                    break;
                default:
                    this.#handleError(new Error("Unknown server message type '" + msg.msg + "'."));
            }
        }
        catch (err) {
            const error = err instanceof Error
                ? new Error("Error parsing data from the server: " + err.message)
                : new Error("Unknown exception while reading from the server.");
            this.#handleError(error);
        }
    }
    // Handles communication with the server until its end. Returns false in case of an error.
    /** @internal */
    async #runLoop() {
        try {
            await this.#closedPromise;
        }
        finally {
            // Ensure subprocess is killed if we exit early (e.g., due to error)
            try {
                this.#connection?.close();
            }
            catch {
                // Ignore errors when closing
            }
        }
        if (this.#errorMessages.length > 0)
            throw new Error(this.#errorMessages.join('\n'));
    }
    /**
     * Requests the solver to stop as soon as possible.
     *
     * @param reason The reason why to stop. The reason will appear in the log
     *
     * @remarks
     * This method only initiates the stop; it returns immediately without waiting
     * for the solver to actually stop. The solver will stop as soon as possible and
     * will send a summary event. However, other events may be sent
     * before the summary event (e.g., another solution found or a log message).
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
     */
    async stop(reason) {
        await this.#startPromise;
        if (this.#closeExpected || !this.#connection)
            return;
        this.#sendMessage({ msg: "stop", reason: reason });
    }
    /**
     * Send an external solution to the solver.
     *
     * @param solution The solution to send. It must be compatible with the model; otherwise, an error is raised
     *
     * @remarks
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
        await this.#startPromise;
        if (this.#closeExpected || !this.#connection)
            return; // The solver has already stopped.
        // Message is sent asynchronously. Solver may die in the middle of the
        // message.  So the documentation is correct about ignoring solutions
        // sent about the time the solver has stopped.
        this.#sendMessage({ msg: "solution", data: solution._serialize() });
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
        return this.#started && (this.#closeExpected || !this.#connection);
    }
    #sendMessage(msg) {
        if (this.#connection)
            this.#connection.send(JSON.stringify(msg));
        else
            this.#handleError(new Error("Unable to write to the solver: not connected."));
    }
    /**
     * Resets process state fields after solver connection closes.
     * Called automatically when the connection is closed.
     * @internal
     */
    _resetProcessState() {
        this.#connection = undefined;
        this.#closeExpected = false;
        this.#started = false;
        this.#handshakeReceived = false;
    }
    /**
     * Resets process and result state fields to allow Solver reuse.
     * @internal
     */
    _resetState() {
        this._resetProcessState();
        this.#summary = undefined;
        this.#objectiveHistory = [];
        this.#objectiveBoundHistory = [];
        this.#solution = undefined;
        this.#solutionTime = undefined;
        this.#boundTime = undefined;
        this.#solutionValid = undefined;
        this.#errorMessages = [];
    }
}
/** @internal @deprecated Use `Model.toJSON` instead. */
export function problem2json(problem) {
    return problem.model.toJSON(problem.parameters, problem.warmStart);
}
/** @internal @deprecated Use `Model.fromJSON` instead. */
export function json2problem(json) {
    return Model.fromJSON(json);
}
/** @internal */
export async function _toText(model, cmd, params, warmStart) {
    let solver = new Solver;
    try {
        let result = undefined;
        solver._onTextModel = (msg) => { result = msg; };
        await solver._run(cmd, model, params, warmStart);
        if (result === undefined)
            throw Error("Internal error: 'textModel' event was not received");
        return result;
    }
    finally {
        solver._resetState();
    }
}
/**
 * @internal
 *
 * Computes domains after constraint propagation.
 *
 * @param model The model to propagate.
 * @param parameters The parameters to use for propagation.
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
 *   model.enforce(model.le(tasks[i].end(), 19));
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
 * @category Propagation
 */
export async function propagate(model, parameters) {
    let solver = new Solver;
    try {
        let result = undefined;
        solver._onDomains = (msg) => {
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
        };
        await solver._run('propagate', model, parameters, undefined);
        if (result === undefined)
            throw new Error("Internal error in propagate: domains message not received");
        return result;
    }
    finally {
        solver._resetState();
    }
}
// ==================================================
// Deprecated top-level API
// ==================================================
/** @internal @deprecated Use `ModelElement` instead. */
export const ModelNode = ModelElement;
//# sourceMappingURL=browser.js.map