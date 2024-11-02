/**
 * Copyright (C) CoEnzyme SAS - All Rights Reserved
 *
 * This source code is protected under international copyright law.  All rights
 * reserved and protected by the copyright holders.
 * This file is confidential and only available to authorized individuals with the
 * permission of the copyright holders.  If you encounter this file and do not have
 * permission, please contact the copyright holders and delete this file.
 */
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'node:events';
/**
 * The version of the module, such as "1.0.0".
 * @category Constants
 */
export declare const Version = "2024.11.0";
declare const enum PresenceStatus {
    Optional = 0,
    Present = 1,
    Absent = 2
}
type IndirectArgument = {
    arg?: NodeProps;
    ref?: number;
};
type ScalarArgument = number | boolean | IndirectArgument;
type Argument = ScalarArgument | Array<ScalarArgument> | number[][];
interface NodeProps {
    func: string;
    args: Array<Argument>;
    name?: string;
    status?: PresenceStatus;
    min?: number | boolean;
    max?: number | boolean;
    startMin?: number;
    startMax?: number;
    endMin?: number;
    endMax?: number;
    lengthMin?: number;
    lengthMax?: number;
    values?: number[][];
}
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
 * @category Constants
 */
export declare const IntVarMax = 1073741823;
/**
 * Minimum value of a decision variable or a decision expression (such as `x+1` where `x` is a variable).
 * The opposite of {@link IntVarMax}.
 * @category Constants
 */
export declare const IntVarMin: number;
/**
 * Maximum value of start or end of an interval variable. The opposite of {@link IntervalMin}.
 * @category Constants
 */
export declare const IntervalMax = 715827882;
/**
 * Minimum value of start or end of an interval variable. The opposite of {@link IntervalMax}.
 * @category Constants
 */
export declare const IntervalMin = -715827882;
/**
 * Maximum length of an interval variable. The maximum length can be achieved by
 * an interval that starts at {@link IntervalMin} and ends at {@link
 * IntervalMax}.
 * @category Constants
 */
export declare const LengthMax: number;
/** @internal */
export declare const FloatVarMax: number;
/** @internal */
export declare const FloatVarMin: number;
/**
 * A value emitted by {@link Solver} as `summary` event at the end of the
 * solve.
 * The information includes the number of solutions found, the total duration
 * of the solve, the number of branches, fails, propagations, restarts, etc.
 *
 * @see {@link SolveSummary}
 * @see {@link Solver.on | Solver.on("summary", ...)}
 *
 * @category Solving
 */
export type SolveSummary = {
    /** Number of solutions found during the solve. */
    nbSolutions: number;
    /** Whether the solve ended by a proof (of optimality or infeasibility). */
    proof: boolean;
    /** The total duration of the solve (measured by the server). */
    duration: number;
    /** The total number of branches during the solve. */
    nbBranches: number;
    /** The total number of fails during the solve. */
    nbFails: number;
    /** The total number of propagations during the solve. */
    nbLNSSteps: number;
    /** The total number of restarts during the solve. */
    nbRestarts: number;
    /** Memory used during the solve (in bytes). */
    memoryUsed: number;
    /** Objective value of the best solution found. If no solution was found, then `undefined`. */
    objective?: ObjectiveValue;
    /** Lower bound of the objective: the solver proved that there isn't any
     * solution with a better objective value than the lower bound.
     * If no such bound was proved then `undefined`. */
    lowerBound?: ObjectiveValue;
    /** @internal The total number of integer variables in the input model. */
    nbIntVars: number;
    /** The total number of interval variables in the input model. */
    nbIntervalVars: number;
    /** The total number of constraints in the input model. */
    nbConstraints: number;
    /** The solver used for solving. A string such as `"OptalCP 1.0.0"`. */
    solver: string;
    /** Number of workers (CPU threads) used during the solve. */
    nbWorkers: number;
    /** The CPU name detected by the solver. A string such as `"AMD Ryzen 9 5950X"`. */
    cpu: string;
    /** Whether the objective was to minimize, maximize or no objective was given. */
    objectiveSense: "minimize" | "maximize" | undefined;
};
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
 * @category Modeling
 */
export declare abstract class ModelNode {
    #private;
    protected _props: NodeProps;
    protected _cp: Model;
    /** @internal */
    constructor(cp: Model, func: string, args: Array<Argument>);
    /** @internal */
    constructor(cp: Model, props: NodeProps, id: number);
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
    setName(name: string): this;
    /** Returns the name assigned to the node. */
    getName(): string | undefined;
    /** @internal */
    _getProps(): NodeProps;
    /** @internal */
    _getArg(): IndirectArgument;
    /** @internal */
    _forceRef(): void;
    /** @internal */
    _getId(): number;
}
/**
 * @internal
 */
declare class Constraint extends ModelNode {
    #private;
}
/**
 * A class representing floating-point expression in the model.
 * Currently, there is no way to create floating-point expressions.
 * The class is only a base class for {@link IntExpr}.
 * @category Modeling
 */
export declare class FloatExpr extends ModelNode {
    #private;
    /** @internal */
    _reusableFloatExpr(): FloatExpr;
    /** @internal */
    _floatIdentity(arg: FloatExpr | number): void;
    /** @internal */
    _floatGuard(absentValue?: number): FloatExpr;
    /** @internal */
    neg(): FloatExpr;
    /** @internal */
    _floatPlus(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMinus(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatTimes(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatDiv(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatEq(arg: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatNe(arg: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLt(arg: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLe(arg: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGt(arg: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGe(arg: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatInRange(lb: number, ub: number): BoolExpr;
    /** @internal */
    _floatNotInRange(lb: number, ub: number): BoolExpr;
    /** @internal */
    abs(): FloatExpr;
    /** @internal */
    square(): FloatExpr;
    /** @internal */
    _floatMin2(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMax2(arg: FloatExpr | number): FloatExpr;
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
 * @category Modeling
 */
export declare class IntExpr extends FloatExpr {
    #private;
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
    minimize(): void;
    /**
     * Maximize the expression. I.e., search for a solution that achieves the maximal
     * value of the expression.
     *
     * @remarks
     * Equivalent of function {@link Model.maximize | Model.maximize}.
     *
     * The opposite of {@link minimize}.
     */
    maximize(): void;
    /** @internal */
    _reusableIntExpr(): IntExpr;
    /**
    * Returns an expression which is _true_ if the expression is _present_ and _false_ when it is _absent_.
    *
    * @remarks
    *
    * The resulting expression is never _absent_.
    *
    * Same as {@link Model.presenceOf | Model.presenceOf}. */
    presence(): BoolExpr;
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
    guard(absentValue?: number): IntExpr;
    /**
    * Returns negation of the expression.
    *
    * @remarks
    *
    * If the expression has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.neg | Model.neg}. */
    neg(): IntExpr;
    /**
    * Returns addition of the expression and the argument.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.plus | Model.plus}. */
    plus(arg: IntExpr | number): IntExpr;
    /**
    * Returns subtraction of the expression and `arg`.@remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.minus | Model.minus}. */
    minus(arg: IntExpr | number): IntExpr;
    /**
    * Returns multiplication of the expression and `arg`.@remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.times | Model.times}. */
    times(arg: IntExpr | number): IntExpr;
    /**
    * Returns integer division of the expression `arg`. The division rounds towards zero.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.div | Model.div}. */
    div(arg: IntExpr | number): IntExpr;
    /** @internal */
    _modulo(arg: IntExpr | number): IntExpr;
    /**
    * Constrains the expression to be identical to the argument, including their presence status.
    *
    * @remarks
    *
    * Identity is different than equality. For example, if `x` is _absent_, then `x.eq(0)` is _absent_, but `x.identity(0)` is _false_.
    *
    * Same as {@link Model.identity | Model.identity}. */
    identity(arg: IntExpr | number): void;
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
    eq(arg: IntExpr | number): BoolExpr;
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
    ne(arg: IntExpr | number): BoolExpr;
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
    lt(arg: IntExpr | number): BoolExpr;
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
    le(arg: IntExpr | number): BoolExpr;
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
    gt(arg: IntExpr | number): BoolExpr;
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
    ge(arg: IntExpr | number): BoolExpr;
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
    inRange(lb: number, ub: number): BoolExpr;
    /** @internal */
    _notInRange(lb: number, ub: number): BoolExpr;
    /**
    * Creates an integer expression which is absolute value of the expression.
    *
    * @remarks
    *
    * If the expression has value _absent_, the resulting expression also has value _absent_.
    *
    * Same as {@link Model.abs | Model.abs}.  */
    abs(): IntExpr;
    /**
    * Creates an integer expression which is the minimum of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.min2 | Model.min2}. See {@link Model.min} for the n-ary minimum. */
    min2(arg: IntExpr | number): IntExpr;
    /**
    * Creates an integer expression which is the maximum of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.max2 | Model.max2}. See {@link Model.max | Model.max} for n-ary maximum. */
    max2(arg: IntExpr | number): IntExpr;
    /** @internal */
    square(): IntExpr;
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
 * @category Modeling
 */
export declare class BoolExpr extends IntExpr {
    #private;
    /** @internal */
    _reusableBoolExpr(): BoolExpr;
    /**
    * Returns negation of the expression.
    *
    * @remarks
    *
    * If the expression has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.not | Model.not}. */
    not(): BoolExpr;
    /**
    * Returns logical _OR_ of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.or | Model.or}. */
    or(arg: BoolExpr | boolean): BoolExpr;
    /**
    * Returns logical _AND_ of the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.and | Model.and}. */
    and(arg: BoolExpr | boolean): BoolExpr;
    /**
    * Returns implication between the expression and `arg`.
    *
    * @remarks
    *
    * If the expression or `arg` has value _absent_, then the resulting expression has also value _absent_.
    *
    * Same as {@link Model.implies | Model.implies}. */
    implies(arg: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _eq(arg: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _ne(arg: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _nand(arg: BoolExpr | boolean): BoolExpr;
}
/** @internal */
export declare class Objective extends ModelNode {
    #private;
}
/** @internal */
export declare class IntVar extends IntExpr {
    /** @internal */
    constructor(cp: Model);
    /** @internal */
    constructor(cp: Model, props: NodeProps, id: number);
    /** @internal */
    _makeAuxiliary(): void;
    isOptional(): boolean;
    isPresent(): boolean;
    isAbsent(): boolean;
    getMin(): number | null;
    getMax(): number | null;
    makeOptional(): IntVar;
    makeAbsent(): IntVar;
    makePresent(): IntVar;
    setMin(min: number): this;
    setMax(max: number): this;
    setRange(min: number, max: number): this;
}
/** @internal */
export declare class FloatVar extends FloatExpr {
    /** @internal */
    constructor(cp: Model);
    /** @internal */
    constructor(cp: Model, props: NodeProps, id: number);
    /** @internal */
    _makeAuxiliary(): void;
    isOptional(): boolean;
    isPresent(): boolean;
    isAbsent(): boolean;
    getMin(): number | null;
    getMax(): number | null;
    makeOptional(): FloatVar;
    makeAbsent(): FloatVar;
    makePresent(): FloatVar;
    setMin(min: number): this;
    setMax(max: number): this;
    setRange(min: number, max: number): this;
}
/** @internal */
export declare class BoolVar extends BoolExpr {
    /** @internal */
    constructor(cp: Model);
    /** @internal */
    constructor(cp: Model, props: NodeProps, id: number);
    /** @internal */
    _makeAuxiliary(): void;
    isOptional(): boolean;
    isPresent(): boolean;
    isAbsent(): boolean;
    getMin(): boolean | null;
    getMax(): boolean | null;
    makeOptional(): BoolVar;
    makeAbsent(): BoolVar;
    makePresent(): BoolVar;
    setMin(min: boolean): this;
    setMax(max: boolean): this;
    setRange(min: number, max: number): this;
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
 * let model = CP.Model();
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
 * let model = CP.Model();
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
 * @category Modeling
 */
export declare class IntervalVar extends ModelNode {
    #private;
    /** @internal */
    constructor(cp: Model);
    /** @internal */
    constructor(cp: Model, props: NodeProps, id: number);
    /** @internal */
    _makeAuxiliary(): void;
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
    isOptional(): boolean;
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
    isPresent(): boolean;
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
    isAbsent(): boolean;
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
    getStartMin(): number | null;
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
    getStartMax(): number | null;
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
    getEndMin(): number | null;
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
    getEndMax(): number | null;
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
    getLengthMin(): number | null;
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
    getLengthMax(): number | null;
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
    makeOptional(): IntervalVar;
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
    makePresent(): IntervalVar;
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
    makeAbsent(): IntervalVar;
    /**
     * Sets the start of the interval variable to the given value.
     *
     * It overwrites any previous start limits given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setStart}, {@link setStartMin} or {@link setStartMax}.
     *
     * Equivalent to:
     * ```ts
     * intervalVar.setStartMin(s);
     * intervalVar.setStartMax(s);
     * ```
     * Note that the start of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setStartMin}, {@link setStartMax}
     * @see {@link getStartMin}, {@link getStartMax}
     */
    setStart(s: number): IntervalVar;
    /**
     * Limits the possible start value of the variable to the range `sMin` to `sMax`.
     *
     * It overwrites any previous start limits given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setStart}, {@link setStartMin} or {@link setStartMax}.
     *
     * Equivalent to:
     * ```ts
     * intervalVar.setStartMin(sMin);
     * intervalVar.setStartMax(sMax);
     * ```
     *
     * Note that the start of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setStartMin}, {@link setStartMax}
     * @see {@link getStartMin}, {@link getStartMax}
     */
    setStart(sMin: number, sMax: number): IntervalVar;
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
    setStartMin(sMin: number): IntervalVar;
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
    setStartMax(sMax: number): IntervalVar;
    /**
     * Sets the end of the interval variable to the given value.
     *
     * It overwrites any previous end limits given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setEnd}, {@link setEndMin} or {@link setEndMax}.
     *
     * Equivalent to:
     * ```ts
     * intervalVar.setEndMin(e);
     * intervalVar.setEndMax(e);
     * ```
     *
     * Note that the end of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setEndMin}, {@link setEndMax}
     * @see {@link getEndMin}, {@link getEndMax}
     */
    setEnd(e: number): IntervalVar;
    /**
     * Limits the possible end of the variable to the range `eMin` to `eMax`.
     *
     * It overwrites any previous end limits given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setEnd}, {@link setEndMin} or {@link setEndMax}.
     *
     * Equivalent to:
     * ```ts
     * intervalVar.setEndMin(eMin);
     * intervalVar.setEndMax(eMax);
     * ```
     *
     * Note that the end of the interval variable must be in the range {@link IntervalMin} to {@link IntervalMax}.
     *
     * @see {@link setEndMin}, {@link setEndMax}
     * @see {@link getEndMin}, {@link getEndMax}
     */
    setEnd(eMin: number, eMax: number): IntervalVar;
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
    setEndMin(eMin: number): IntervalVar;
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
    setEndMax(eMax: number): IntervalVar;
    /**
     * Sets the length of the interval variable to the given value.
     * It overwrites any previous length limits given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setLength}, {@link setLengthMin} or {@link setLengthMax}.
     *
     * Equivalent to:
     * ```ts
     * intervalVar.setLengthMin(l);
     * intervalVar.setLengthMax(l);
     * ```
     *
     * Note that the length of the interval variable must be in the range 0 to {@link LengthMax}.
     *
     * @see {@link setLengthMin}, {@link setLengthMax}
     * @see {@link getLengthMin}, {@link getLengthMax}
     */
    setLength(l: number): IntervalVar;
    /**
     * Limits the possible length of the variable to the range `lMin` to `lMax`.
     * It overwrites any previous length limits given at variable creation by
     * {@link Model.intervalVar | Model.intervalVar} or later by
     * {@link setLength}, {@link setLengthMin} or {@link setLengthMax}.
     *
     * Equivalent to:
     * ```ts
     * intervalVar.setLengthMin(lMin);
     * intervalVar.setLengthMax(lMax);
     * ```
     *
     * Note that the length of the interval variable must be in the range 0 to {@link LengthMax}.
     *
     * @see {@link setLengthMin}, {@link setLengthMax}
     * @see {@link getLengthMin}, {@link getLengthMax}
     */
    setLength(lMin: number, lMax: number): IntervalVar;
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
    setLengthMin(lMin: number): IntervalVar;
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
    setLengthMax(lMax: number): IntervalVar;
    /**
    * Creates a Boolean expression which is true if the interval variable is present.
    *
    * @remarks
    *
    * This function is the same as {@link Model.presenceOf | Model.presenceOf}, see its documentation for more details. */
    presence(): BoolExpr;
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
    start(): IntExpr;
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
    end(): IntExpr;
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
    length(): IntExpr;
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
    startOr(absentValue: number): IntExpr;
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
    endOr(absentValue: number): IntExpr;
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
    lengthOr(absentValue: number): IntExpr;
    /** @internal */
    _overlapLength(interval2: IntervalVar): IntExpr;
    /** @internal */
    _alternativeCost(options: IntervalVar[], weights: number[]): IntExpr;
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
    endBeforeEnd(successor: IntervalVar, delay?: IntExpr | number): void;
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
    endBeforeStart(successor: IntervalVar, delay?: IntExpr | number): void;
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
    startBeforeEnd(successor: IntervalVar, delay?: IntExpr | number): void;
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
    startBeforeStart(successor: IntervalVar, delay?: IntExpr | number): void;
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
    endAtEnd(successor: IntervalVar, delay?: IntExpr | number): void;
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
    endAtStart(successor: IntervalVar, delay?: IntExpr | number): void;
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
    startAtEnd(successor: IntervalVar, delay?: IntExpr | number): void;
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
    startAtStart(successor: IntervalVar, delay?: IntExpr | number): void;
    /**
    * Creates alternative constraints for the interval variable and provided `options`.
    *
    * @param options Interval variables to choose from.
    *
    * @remarks
    *
    * This constraint is the same as {@link Model.alternative}. */
    alternative(options: IntervalVar[]): void;
    /**
    * Constraints the interval variable to span (cover) a set of other interval variables.
    *
    * @param covered The set of interval variables to cover.
    *
    * @remarks
    *
    * This constraint is the same as {@link Model.span}. */
    span(covered: IntervalVar[]): void;
    /**
    * Creates an expression equal to the position of the interval on the sequence.
    *
    * @remarks
    *
    * This function is the same as {@link Model.position | Model.position}. */
    position(sequence: SequenceVar): IntExpr;
    /**
    * Creates cumulative function (expression) _pulse_ for the interval variable and specified height.
    *
    * @remarks
    *
    * This function is the same as {@link Model.pulse | Model.pulse}. */
    pulse(height: IntExpr | number): CumulExpr;
    /**
    * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
    *
    * @remarks
    *
    * This function is the same as {@link Model.stepAtStart | Model.stepAtStart}. */
    stepAtStart(height: IntExpr | number): CumulExpr;
    /**
    * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
    *
    * @remarks
    *
    * This function is the same as {@link Model.stepAtEnd | Model.stepAtEnd}. */
    stepAtEnd(height: IntExpr | number): CumulExpr;
    /** @internal */
    _precedenceEnergyBefore(others: IntervalVar[], heights: number[], capacity: number): void;
    /** @internal */
    _precedenceEnergyAfter(others: IntervalVar[], heights: number[], capacity: number): void;
    /**
    * Forbid the interval variable to overlap with segments of the function where the value is zero.
    *
    * @remarks
    *
    * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero. I.e., if $[s, e)$ is a segment of the step function where the value is zero, then the interval variable either ends before $s$ ($\mathtt{interval.end()} \le s$) or starts after $e$ ($e \le \mathtt{interval.start()}$.
    *
    * @see {@link Model.forbidExtent} for the equivalent function on {@link Model}.
    * @see {@link Model.forbidStart}, {@link Model.forbidEnd} for similar functions that constrain the start/end of an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidExtent(func: IntStepFunction): void;
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
    forbidStart(func: IntStepFunction): void;
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
    forbidEnd(func: IntStepFunction): void;
    /** @internal */
    _disjunctiveIsBefore(y: IntervalVar): BoolExpr;
}
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
 */
export declare class SequenceVar extends ModelNode {
    #private;
    /** @internal */
    constructor(cp: Model, func: string, args: Argument[]);
    /** @internal */
    _makeAuxiliary(): void;
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
    noOverlap(transitions?: number[][]): void;
    /** @internal */
    _noOverlap(transitions?: number[][]): void;
    /** @internal */
    _sameSequence(sequence2: SequenceVar): void;
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
 * @category Modeling
 */
export declare class CumulExpr extends ModelNode {
    #private;
    /**
    * Addition of two cumulative expressions.
    *
    * @remarks
    *
    * This function is the same as {@link Model.plus | Model.plus}.
    *  */
    cumulPlus(rhs: CumulExpr): CumulExpr;
    /**
    * Subtraction of two cumulative expressions.
    *
    * @remarks
    *
    * This function is the same as {@link Model.minus | Model.minus}.
    *  */
    cumulMinus(rhs: CumulExpr): CumulExpr;
    /**
    * Negation of a cumulative expression.
    *
    * @remarks
    *
    * This function is the same as {@link Model.neg | Model.neg}.
    *  */
    cumulNeg(): CumulExpr;
    /**
    * Constraints the cumulative function to be everywhere less or equal to `maxCapacity`.
    *
    * This function can be used to specify the maximum limit of resource usage at any time. For example, to limit the number of workers working simultaneously, limit the maximum amount of material on stock, etc.
    * See {@link Model.pulse} for an example with `cumulLe`.
    *
    * @see {@link Model.cumulLe | Model.cumulLe} for the equivalent function on {@link Model}.
    * @see {@link Model.cumulGe} for the opposite constraint.
    *  */
    cumulLe(maxCapacity: number): void;
    /**
    * Constraints the cumulative function to be everywhere greater or equal to `minCapacity`.
    *
    * This function can be used to specify the minimum limit of resource usage at any time. For example to make sure that there is never less than zero material on stock.
    * See {@link Model.stepAtStart} for an example with `cumulGe`.
    *
    * @see {@link Model.cumulGe | Model.cumulGe} for the equivalent function on {@link Model}.
    * @see {@link Model.cumulLe} for the opposite constraint.
    *  */
    cumulGe(minCapacity: number): void;
    /** @internal */
    _cumulMaxProfile(profile: IntStepFunction): void;
    /** @internal */
    _cumulMinProfile(profile: IntStepFunction): void;
}
/**
 * Integer step function.
 *
 * Integer step function is a piecewise constant function defined on integer
 * values in range {@link IntVarMin} to {@link IntVarMax}. The function can be
 * created by {@link Model.intStepFunction}.
 *
 * Step functions can be used in the following ways:
 *
 *   * Function {@link Model.stepFunctionEval} evaluates the function at the given point (given as {@link IntExpr}).
 *   * Function {@link Model.stepFunctionSum} computes a sum (integral) of the function over an {@link IntervalVar}.
 *   * Constraints {@link Model.forbidStart} and {@link Model.forbidEnd} forbid the start/end of an {@link IntervalVar} to be in a zero-value interval of the function.
 *   * Constraint {@link Model.forbidExtent} forbids the extent of an {@link IntervalVar} to be in a zero-value interval of the function.
 *
 * @category Modeling
 */
export declare class IntStepFunction extends ModelNode {
    #private;
    /** @internal */
    constructor(cp: Model, values: number[][]);
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
    stepFunctionSum(interval: IntervalVar): IntExpr;
    /** @internal */
    _stepFunctionSumInRange(interval: IntervalVar, lb: number, ub: number): void;
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
    stepFunctionEval(arg: IntExpr | number): IntExpr;
    /** @internal */
    _stepFunctionEvalInRange(arg: IntExpr | number, lb: number, ub: number): void;
    /** @internal */
    _stepFunctionEvalNotInRange(arg: IntExpr | number, lb: number, ub: number): void;
}
/** @internal */
declare class SearchDecision extends ModelNode {
    #private;
}
/**
 * WorkerParameters specify the behavior of each worker separately.
 * It is part of the {@link Parameters} object.
 *
 * If a parameter is not listed here, then it can be set only globally (in {@link
 * Parameters}}), not per worker.  For example, _timeLimit_ or _logPeriod_ are
 * global parameters.
 *
 * @category Parameters
 */
export type WorkerParameters = {
    /**
    * Type of search to use.
    *
    * Possible values are:
    *
    * *  `LNS`: Large Neighborhood Search
    * *  `FDS`: Failure-Directed Search
    * *  `FDSLB`: Failure-Directed Searching working on lower bound
    * *  `SetTimes`: Depth-first set-times search (not restarted)
    *
    *
    * The default value is `LNS`.
    */
    searchType?: "LNS" | "FDS" | "FDSLB" | "SetTimes";
    /**
    * Random seed.
    *
    * The solver breaks ties randomly using a pseudorandom number generator. This parameter sets the seed of the generator.
    *
    * Note that when {@link Parameters.nbWorkers} is more than 1 then there is also another source of randomness: the time it takes for a message to pass from one worker to another. Therefore with {@link Parameters.nbWorkers}=1 the solver is deterministic (random behavior depends only on random seed). With {@link Parameters.nbWorkers}>1 the solver is not deterministic.
    *
    * Even with {@link NbSeeds}=1 and the same random seed, the solver may behave differently on different platforms. This can be due to different implementations of certain functions such as `std::sort`.
    *
    * The parameter takes an unsigned integer value.
    * The default value is `1`.
    */
    randomSeed?: number;
    /**
    * The minimal amount of memory in kB for a single allocation.
    *
    * The solver allocates memory in blocks. This parameter sets the minimal size of a block. Larger blocks mean a higher risk of wasting memory. However, larger blocks may also lead to better performance, particularly when the size matches the page size supported by the operating system.
    *
    * The value of this parameter must be a power of 2.
    *
    * The default value is 2048 means 2MB, which means that up to ~12MB can be wasted per worker in the worst case.
    *
    * The parameter takes an unsigned integer value  in range `4..1073741824`.
    * The default value is `2048`.
    */
    allocationBlockSize?: number;
    /**
    *  @internal
    * Fail limit for each worker.
    *
    * `FailLimit` sets the maximum number of failures for each worker. By default, there is no limit.
    *
    * When one of the workers hits the limit, then it stops. Other workers may continue working (until they also hit a limit).
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerFailLimit?: number;
    /**
    *  @internal
    * Branch limit for every worker.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerBranchLimit?: number;
    /**
    *  @internal
    * Stop the worker after the given number of solutions.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerSolutionLimit?: number;
    /**
    *  @internal
    * Stop the worker after given number of LNS steps.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerLNSStepLimit?: number;
    /**
    *  @internal
    * Stop the worker after the given number of restarts.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerRestartLimit?: number;
    /**
    * How much to propagate noOverlap constraints.
    *
    * This parameter controls the amount of propagation done for noOverlap constraints.
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * More propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..4`.
    * The default value is `2`.
    */
    noOverlapPropagationLevel?: number;
    /**
    * How much to propagate constraints on cumul functions.
    *
    * This parameter controls the amount of propagation done for {@link Model.cumulLe} constraint when used with a sum of {@link Model.pulse | pulses}.
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * More propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..3`.
    * The default value is `1`.
    */
    cumulPropagationLevel?: number;
    /**
    * How much to propagate constraints on cumul functions.
    *
    * This parameter controls the amount of propagation done for {@link Model.cumulLe} and {@link Model.cumulGe} when used together with steps ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}).
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * More propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..2`.
    * The default value is `1`.
    */
    reservoirPropagationLevel?: number;
    /**
    * How much to propagate position expressions on noOverlap constraints.
    *
    * This parameter controls the amount of propagation done for position expressions on noOverlap constraints.
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * However, more propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..3`.
    * The default value is `2`.
    */
    positionPropagationLevel?: number;
    /**
    * How much to propagate stepFunctionSum expression.
    *
    * This parameter controls the amount of propagation done for {@link Model.stepFunctionSum} expressions.
    * In particular, it controls whether the propagation also affects the minimum and the maximum length of the associated interval variable:
    *
    * * `1`: The length is updated only once during initial constraint propagation.
    * * `2`: The length is updated every time the expression is propagated.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..2`.
    * The default value is `1`.
    */
    stepFunctionSumPropagationLevel?: number;
    /**
    * Level of search trace.
    *
    * This parameter is available only in the development edition of the solver.
    *
    * When set to a value bigger than zero, the solver prints a trace of the search.
    * The trace contains information about every choice taken by the solver.
    * The higher the value, the more information is printed.
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    searchTraceLevel?: number;
    /**
    * Level of propagation trace.
    *
    * This parameter is available only in the development edition of the solver.
    *
    * When set to a value bigger than zero, the solver prints a trace of the propagation,
    * that is a line for every domain change.
    * The higher the value, the more information is printed.
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    propagationTraceLevel?: number;
    /**
    * Initial rating for newly created choices.
    *
    * Default rating for newly created choices. Both left and right branches get the same rating.
    * Choice is initially permuted so that bigger domain change is the left branch.
    *
    * The parameter takes a floating point value  in range `0.000000..2.000000`.
    * The default value is `0.5`.
    */
    fdsInitialRating?: number;
    /**
    * Weight of the reduction factor in rating computation.
    *
    * When computing the local rating of a branch, multiply reduction factor by the given weight.
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `1`.
    */
    fdsReductionWeight?: number;
    /**
    * Length of average rating computed for choices.
    *
    * For the computation of rating of a branch. Arithmetic average is used until the branch
    * is taken at least FDSRatingAverageLength times. After that exponential moving average
    * is used with parameter alpha = 1 - 1 / FDSRatingAverageLength.
    *
    * The parameter takes an integer value  in range `0..254`.
    * The default value is `25`.
    */
    fdsRatingAverageLength?: number;
    /**
    * When non-zero, alpha factor for rating updates.
    *
    * When this parameter is set to a non-zero, parameter FDSRatingAverageLength is ignored.
    * Instead, the rating of a branch is computed as an exponential moving average with the given parameter alpha.
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0`.
    */
    fdsFixedAlpha?: number;
    /**
    * Whether to compare the local rating with the average.
    *
    * Possible values are:
    *
    *  * `Off` (the default): No comparison is done.
    *  * `Global`: Compare with the global average.
    *  * `Depth`: Compare with the average on the current search depth
    *
    * Arithmetic average is used for global and depth averages.
    *
    * The default value is `Off`.
    */
    fdsRatingAverageComparison?: "Off" | "Global" | "Depth";
    /**
    * Reduction factor R for rating computation.
    *
    * Possible values are:
    *
    *  * `Normal` (the default): Normal reduction factor.
    *  * `Zero`: Factor is not used (it is 0 all the time).
    *  * `Random`: A random number in the range [0,1] is used instead.
    *
    *
    * The default value is `Normal`.
    */
    fdsReductionFactor?: "Normal" | "Zero" | "Random";
    /**
    * Whether always reuse closing choice.
    *
    * Most of the time, FDS reuses closing choice automatically. This parameter enforces it all the time.
    *
    * The default value is `false`.
    */
    fdsReuseClosing?: boolean;
    /**
    * Whether all initial choices have the same step length.
    *
    * When set, then initial choices generated on interval variables will have the same step size.
    *
    * The default value is `true`.
    */
    fdsUniformChoiceStep?: boolean;
    /**
    * Choice step relative to average length.
    *
    * Ratio of initial choice step size to the minimum length of interval variable.When FDSUniformChoiceStep is set, this ratio is used to compute global choice step using the average of interval var length.When FDSUniformChoiceStep is not set, this ratio is used to compute the choice step for every interval var individually.
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `0.699999988079071`.
    */
    fdsLengthStepRatio?: number;
    /**
    * Maximum number of choices generated initially per a variable.
    *
    * Initial domains are often very large (e.g., `0..IntervalMax`). Therefore initial
    * number of generated choices is limited: only choices near startMin are kept.
    *
    * The parameter takes an unsigned integer value  in range `2..2147483647`.
    * The default value is `90`.
    */
    fdsMaxInitialChoicesPerVariable?: number;
    /**
    * Domain split ratio when run out of choices.
    *
    * When all choices are decided, and a greedy algorithm cannot find a solution, then
    * more choices are generated by splitting domains into the specified number of pieces.
    *
    * The parameter takes a floating point value  in range `2.000000..Infinity`.
    * The default value is `7`.
    */
    fdsAdditionalStepRatio?: number;
    /**
    * Whether to generate choices on presence status.
    *
    * Choices on start time also include a choice on presence status. Therefore, dedicated choices on presence status only are not mandatory.
    *
    * The default value is `true`.
    */
    fdsPresenceStatusChoices?: boolean;
    /**
    * Maximum step when generating initial choices for integer variables..
    *
    * For a variable with big initial domains, choices are generated only around min value considering the given step.
    *
    * The parameter takes an unsigned integer value  in range `1..1073741823`.
    * The default value is `107374182`.
    */
    fdsMaxInitialIntVarChoiceStep?: number;
    /**
    * Influence of event time to initial choice rating.
    *
    * When non-zero, the initial choice rating is influenced by the date of the choice.
    * This way, very first choices in the search should be taken chronologically.
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0`.
    */
    fdsEventTimeInfluence?: number;
    /**
    * How much to improve rating when both branches fail immediately.
    *
    * This parameter sets a bonus reward for a choice when both left and right branches fail immediately.
    * Current rating of both branches is multiplied by the specified value.
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.98`.
    */
    fdsBothFailRewardFactor?: number;
    /**
    * How often to chose a choice randomly.
    *
    * Probability that a choice is taken randomly. A randomly selected choice is not added to the search tree automatically. Instead, the choice is tried, its rating is updated,
    * but it is added to the search tree only if one of the branches fails.
    * The mechanism is similar to strong branching.
    *
    * The parameter takes a floating point value  in range `0.000000..0.999990`.
    * The default value is `0.1`.
    */
    fdsEpsilon?: number;
    /**
    * Number of choices to try in strong branching.
    *
    * Strong branching means that instead of taking a choice with the best rating,
    * we take the specified number (FDSStrongBranchingSize) of best choices,
    * try them in dry-run mode, measure their local rating, and
    * then chose the one with the best local rating.
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `10`.
    */
    fdsStrongBranchingSize?: number;
    /**
    * Up-to what search depth apply strong branching.
    *
    * Strong branching is typically used in the root node. This parameter controls
    * the maximum search depth when strong branching is used.
    *
    * The parameter takes an unsigned integer value.
    * The default value is `6`.
    */
    fdsStrongBranchingDepth?: number;
    /**
    * How to choose the best choice in strong branching.
    *
    * Possible values are:
    *
    * * `Both`: Choose the the choice with best combined rating.
    * * `Left` (the default): Choose the choice with the best rating of the left branch.
    * * `Right`: Choose the choice with the best rating of the right branch.
    *
    *
    * The default value is `Left`.
    */
    fdsStrongBranchingCriterion?: "Both" | "Left" | "Right";
    /**
    * Fail limit for the first restart.
    *
    * Failure-directed search is periodically restarted: explored part of the current search tree is turned into a no-good constraint, and the search starts again in the root node.
    * This parameter specifies the size of the very first search tree (measured in number of failures).
    *
    * The parameter takes an unsigned integer value  in range `1..9223372036854775807`.
    * The default value is `100`.
    */
    fdsInitialRestartLimit?: number;
    /**
    * Restart strategy to use.
    *
    * This parameter specifies how the restart limit (maximum number of failures) changes from restart to restart.
    * Possible values are:
    *
    * * `Geometric` (the default): After each restart, restart limit is multiplied by {@link fdsRestartGrowthFactor}.
    * * `Nested`: Similar to `Geometric` but the limit is changed back to {@link fdsInitialRestartLimit} each time a new maximum limit is reached.
    * * `Luby`: Luby restart strategy is used. Parameter {@link fdsRestartGrowthFactor} is ignored.
    *
    * The default value is `Geometric`.
    */
    fdsRestartStrategy?: "Geometric" | "Nested" | "Luby";
    /**
    * Growth factor for fail limit after each restart.
    *
    * After each restart, the fail limit for the restart is multiplied by the specified factor.
    * This parameter is ignored when {@link fdsRestartStrategy} is `Luby`.
    *
    * The parameter takes a floating point value  in range `1.000000..Infinity`.
    * The default value is `1.15`.
    */
    fdsRestartGrowthFactor?: number;
    /**
    * Truncate choice use counts after a restart to this value.
    *
    * The idea is that ratings learned in the previous restart are less valid in the new restart.
    * Using this parameter, it is possible to truncate use counts on choices so that new local ratings will have bigger weights (when FDSFixedAlpha is not used).
    *
    * The parameter takes an unsigned integer value.
    * The default value is `255`.
    */
    fdsMaxCounterAfterRestart?: number;
    /**
    * Truncate choice use counts after a solution is found.
    *
    * Similar to `FDSMaxCounterAfterRestart`, this parameter allows truncating use counts on choices when a solution is found.
    *
    * The parameter takes an unsigned integer value.
    * The default value is `255`.
    */
    fdsMaxCounterAfterSolution?: number;
    /**
    * Reset restart size after a solution is found (ignored in Luby).
    *
    * When this parameter is set (the default), then restart limit is set back to `FDSInitialRestartLimit` when a solution is found.
    *
    * The default value is `true`.
    */
    fdsResetRestartsAfterSolution?: boolean;
    /**
    * Whether to use or not nogood constraints.
    *
    * By default, no-good constraint is generated after each restart. This parameter allows to turn no-good constraints off.
    *
    * The default value is `true`.
    */
    fdsUseNogoods?: boolean;
    /**
    *  @internal
    * Whether to freeze ratings after a proof is found.
    *
    *
    *
    * The default value is `false`.
    */
    _fdsFreezeRatingsAfterProof?: boolean;
    /**
    *  @internal
    * Whether to continue after proof.
    *
    *
    *
    * The default value is `false`.
    */
    _fdsContinueAfterProof?: boolean;
    /**
    *  @internal
    * How many times repeat the proof.
    *
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `1`.
    */
    _fdsRepeatLimit?: number;
    /**
    *  @internal
    * Choose completely randomly.
    *
    *
    *
    * The default value is `false`.
    */
    _fdsCompletelyRandom?: boolean;
    /**
    * Whether to generate choices for objective expression/variable.
    *
    * This option controls the generation of choices on the objective. It works regardless of the objective is given by an expression or a variable.
    *
    * The default value is `false`.
    */
    fdsBranchOnObjective?: boolean;
    /**
    *  @internal
    * Whether to improve nogoods from FDS.
    *
    *
    *
    * The default value is `true`.
    */
    _fdsImproveNogoods?: boolean;
    /**
    * A strategy to choose objective cuts during FDSLB search..
    *
    * Possible values are:
    *
    * * `Minimum`: Always change the cut by the minimum amount. The default value.
    * * `Random`: At each restart, randomly choose a value in range LB..UB.
    * * `Split`: Always split the current range LB..UB in half.
    *
    *
    * The default value is `Minimum`.
    */
    fdsLBStrategy?: "Minimum" | "Random" | "Split";
    /**
    * Whether to reset ratings when a new LB is proved.
    *
    * When this parameter is on, and FDSLB proves a new lower bound, then all ratings are reset to default values.
    *
    * The default value is `false`.
    */
    fdsLBResetRatings?: boolean;
    /**
    *  @internal
    * Initial fail limit in first solution phase (after 0 fails).
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `1..18446744073709551615`.
    * The default value is `100`.
    */
    _lnsFirstFailLimit?: number;
    /**
    *  @internal
    * How much to increase fail limit during first solution phase.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `1.000000..Infinity`.
    * The default value is `2`.
    */
    _lnsFailLimitGrowthFactor?: number;
    /**
    *  @internal
    * Multiply fail limit for LNS steps by this number.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `60`.
    */
    _lnsFailLimitCoefficient?: number;
    /**
    *  @internal
    * Number of all-heuristic iterations after the first solution.
    *
    * If this number is -1 then the initial solution search ends as soon as the first solution is found.If it is 0, then the current iteration is finished. Otherwise, the given number of additional iterations is performed.
    *
    * The parameter takes an integer value  in range `-1..2147483647`.
    * The default value is `1`.
    */
    _lnsIterationsAfterFirstSolution?: number;
    /**
    *  @internal
    * Whether to use aggressive SetTimes dominance during LNS.
    *
    *
    *
    * The default value is `true`.
    */
    _lnsAggressiveDominance?: boolean;
    /**
    *  @internal
    * Probability to choose differently than by the heuristic.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `0`.
    */
    _lnsViolateHeuristicsProbability?: number;
    /**
    *  @internal
    * How many times iterate on the current solution (unless new one is found).
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `1..2147483647`.
    * The default value is `5`.
    */
    _lnsSameSolutionPeriod?: number;
    /**
    *  @internal
    * Number of best solutions that receive most attention.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `1..1000`.
    * The default value is `1`.
    */
    _lnsTier1Size?: number;
    /**
    *  @internal
    * How many worse solutions to remember and sometimes work on.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1000`.
    * The default value is `7`.
    */
    _lnsTier2Size?: number;
    /**
    *  @internal
    * How many other solutions to remember.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1000`.
    * The default value is `10`.
    */
    _lnsTier3Size?: number;
    /**
    *  @internal
    * Probability to work on a solution from tier 2.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `0.1`.
    */
    _lnsTier2Effort?: number;
    /**
    *  @internal
    * Probability to work on a solution from tier 3.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `0.05`.
    */
    _lnsTier3Effort?: number;
    /**
    *  @internal
    * Probability to accept a solution with the same objective value.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `1`.
    */
    _lnsProbabilityAcceptSameObjective?: number;
    /**
    *  @internal
    * Multiplication factor to affect fail limit of every LNS step.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `1`.
    */
    _lnsStepFailLimitFactor?: number;
    /**
    *  @internal
    * How often apply objective cut in LNS steps.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.333333333333333`.
    */
    _lnsApplyCutProbability?: number;
    /**
    *  @internal
    * What POS generation algorithm to use for discrete resource.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1`.
    * The default value is `0`.
    */
    _lnsDiscretePOSAlgorithm?: number;
    /**
    *  @internal
    * What POS generation algorithm to use for reservoir.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1`.
    * The default value is `0`.
    */
    _lnsReservoirPOSAlgorithm?: number;
    /**
    *  @internal
    * Maximum size of a model part considered for structure detection.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..10`.
    * The default value is `4`.
    */
    _lnsSmallStructureLimit?: number;
    /**
    *  @internal
    * Maximum size of an alternative with for O(n^2) structure links.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `0`.
    */
    _lnsStructureAlternativeLimit?: number;
    /**
    *  @internal
    * Probability to chose heuristics randomly.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.2`.
    */
    _lnsHeuristicsEpsilon?: number;
    /**
    *  @internal
    * Learning coefficient for heuristics.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.1`.
    */
    _lnsHeuristicsAlpha?: number;
    /**
    *  @internal
    * Initial Q-values of all heuristics.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `1`.
    */
    _lnsHeuristicsInitialQ?: number;
    /**
    *  @internal
    * Probability to chose portions to relax randomly.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.2`.
    */
    _lnsPortionEpsilon?: number;
    /**
    *  @internal
    * Learning coefficient for portions to relax.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.1`.
    */
    _lnsPortionAlpha?: number;
    /**
    *  @internal
    * Initial Q-values of portions to relax.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `1`.
    */
    _lnsPortionInitialQ?: number;
    /**
    *  @internal
    * Limit for portions to relax that are considered big and used less often.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.2`.
    */
    _lnsPortionHandicapLimit?: number;
    /**
    *  @internal
    * Relative probability to use handicapped portions to relax.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..100`.
    * The default value is `10`.
    */
    _lnsPortionHandicapValue?: number;
    /**
    *  @internal
    * Initial Q-values of handicapped portions to relax.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0`.
    */
    _lnsPortionHandicapInitialQ?: number;
    /**
    *  @internal
    * How many dives before switching to normal LNS.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `20`.
    */
    _lnsDivingLimit?: number;
    /**
    *  @internal
    * Diving fail limit compared to final first solution fail limit.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `1`.
    */
    _lnsDivingFailLimitRatio?: number;
    /**
    * Which worker computes simple lower bound.
    *
    * Simple lower bound is a bound such that infeasibility of a better objective can be proved by propagation only (without the search). The given worker computes simple lower bound before it starts the normal search. If a worker with the given number doesn't exist, then the lower bound is not computed.
    *
    * The parameter takes an integer value  in range `-1..2147483647`.
    * The default value is `0`.
    */
    simpleLBWorker?: number;
    /**
    * Maximum number of feasibility checks.
    *
    * Simple lower bound is computed by binary search for the best objective value that is not infeasible by propagation. This parameter limits the maximum number of iterations of the binary search. When the value is 0, then simple lower bound is not computed at all.
    *
    * The parameter takes an unsigned integer value  in range `0..2147483647`.
    * The default value is `2147483647`.
    */
    simpleLBMaxIterations?: number;
    /**
    * Number of shaving rounds.
    *
    * When non-zero, the solver shaves on variable domains to improve the lower bound. This parameter controls the number of shaving rounds.
    *
    * The parameter takes an unsigned integer value  in range `0..2147483647`.
    * The default value is `0`.
    */
    simpleLBShavingRounds?: number;
    /**
    *  @internal
    * Level of internal trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `1`.
    */
    _debugTraceLevel?: number;
    /**
    *  @internal
    * Level of memory trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _memoryTraceLevel?: number;
    /**
    *  @internal
    * Addition internal propagation trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _propagationDetailTraceLevel?: number;
    /**
    *  @internal
    * Level of SetTimes trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _setTimesTraceLevel?: number;
    /**
    *  @internal
    * Trace messages between master and workers.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _communicationTraceLevel?: number;
    /**
    *  @internal
    * Level of conversion trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _conversionTraceLevel?: number;
    /**
    *  @internal
    * Trace creation of expressions in the engine.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _expressionBuilderTraceLevel?: number;
    /**
    *  @internal
    * Level of Memorization trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _memorizationTraceLevel?: number;
    /**
    *  @internal
    * Additional internal search trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _searchDetailTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for Failure-Directed Search.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _fdsTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for shaving.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _shavingTraceLevel?: number;
    /**
    *  @internal
    * Internal trace that dumps ratings of FDS choices.
    *
    * It prints information from Failure-Directed Search in a CSV form suitable for further data processing. Choices are always dumped in the same way regardless of whether it is currently swapped (i.e., regardless of which branch is currently left and right). For this reason, the branches are called *positive* and *negative* instead.
    *
    * An ID of a choice is the following triple:
    *
    * * Variable
    * * Type
    * * Splitting point
    *
    * Using this triple, it is possible to track an individual choice during the log.
    *
    * The log prints three kinds of data rows:
    *
    * * `ChoiceAfterRestart`: After each restart, one row per still an active choice. Level 1.
    * * `StatsAfterRestart`: Current global statistics after restart (one row). Level 1.
    * * `AfterBranchEvaluated`: One row each time after a rating is changed. Includes
    *   actual local rating. Level 2.
    * * `Graph`: statistics about different depths of the search tree. Level 1.
    *   This information is included only if FDS_STATISTICS is defined in `fds.hpp`.
    *
    * At the beginning of the log, there is one descriptive header line for each kind of event.
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _fdsRatingsTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for Large Neighborhood Search.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _lnsTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for heuristic replay.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _heuristicReplayTraceLevel?: number;
    /**
    *  @internal
    * Whether to allow (optimality) proofs by SetTimes.
    *
    * blah blah
    *
    * The default value is `false`.
    */
    _allowSetTimesProofs?: boolean;
    /**
    *  @internal
    * Always use aggressive dominance rules in SetTimes.
    *
    *
    *
    * The default value is `false`.
    */
    _setTimesAggressiveDominance?: boolean;
    /**
    *  @internal
    * Coefficient for computation of the number of extends in SetTimes.
    *
    *
    *
    * The parameter takes a floating point value.
    * The default value is `0.8`.
    */
    _setTimesExtendsCoef?: number;
    /**
    *  @internal
    * Maximum capacity to use low-capacity timetable algorithm.
    *
    *
    *
    * The parameter takes an integer value  in range `0..16`.
    * The default value is `16`.
    */
    _discreteLowCapacityLimit?: number;
    /**
    *  @internal
    * Objective value to start LNS training.
    *
    *
    *
    * The parameter takes a floating point value.
    * The default value is `-Infinity`.
    */
    _lnsTrainingObjectiveLimit?: number;
    /**
    *  @internal
    * Whether to ignore non-touching tasks when generating POS.
    *
    *
    *
    * The default value is `false`.
    */
    _lnsWeakerPOS?: boolean;
    /**
    *  @internal
    * Do not relink POS when an interval variable is relaxed.
    *
    *
    *
    * The default value is `false`.
    */
    _lnsDontRelinkPOS?: boolean;
    /**
    *  @internal
    * Default size of CallbackBlock. Must be multiple of 8..
    *
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `128`.
    */
    _defaultCallbackBlockSize?: number;
};
/**
 * Parameters specify how the solver should behave.  For example, the
 * number of workers (threads) to use, the time limit, etc.
 *
 * Parameters can be passed to the solver using function {@link solve}
 * or by the constructor of the class {@link Solver}.
 *
 * @example
 *
 * In the following example, we are using the _TimeLimit_ parameter to specify
 * that the solver should stop after 5 minutes. We also specify that the solver
 * should use 4 threads. Finally, we specify that the solver should use
 * _FDS_ search (in all threads).
 * ```ts
 * let params = {
 *   timeLimit: 300, // In seconds, i.e. 5 minutes
 *   nbWorkers: 4,   // Use 4 threads
 *   searchType: "FDS"
 * };
 * let result = await CP.solve(myModel, params);
 * ```
 *
 * ### Worker-specific parameters
 *
 * Some parameters can be specified differently for each worker.  For example,
 * some workers may use _LNS_ search while others use _FDS_ search.  To specify
 * worker-specific parameters, use the _workers_ parameter and pass an array
 * of {@link WorkerParameters}.
 *
 * Not all parameters can be specified per worker. For example, _TimeLimit_ is a
 * global parameter. See {@link WorkerParameters} for the list of parameters
 * that can be specified per worker.
 *
 * If a parameter is not set specifically for a worker, the global value is used.
 *
 * @example
 *
 * In the following example, we are going to use 4 workers; two of them will run
 * _FDS_ search and the remaining two will run _LNS_ search.  In addition, workers
 * that use _FDS_ search will use increased propagation levels.
 *
 * ```ts
 * // Parameters for a worker that uses FDS search.
 * // FDS works best with increased propagation levels, so set them:
 * let fdsWorker: CP.WorkerParameters = {
 *   searchType: "FDS",
 *   noOverlapPropagationLevel: 4,
 *   cumulPropagationLevel: 3,
 *   reservoirPropagationLevel: 2
 * };
 * // Global parameters:
 * let params = {
 *   timeLimit: 60,        // In seconds, i.e. 1 minute
 *   searchType: "LNS",   // The default search type. It is not necessary, as "LNS" is the default value.
 *   nbWorkers: 4,        // Use 4 threads
 *   // The first two workers will use FDS search.
 *   // The remaining two workers will use the defaults, i.e., LNS search with default propagation levels.
 *   workers = [fdsWorker, fdsWorker];
 * };
 * let result = await CP.solve(myModel, params);
 * ```
 *
 * @see {@link WorkerParameters} for worker-specific parameters.
 *
 * @see {@link BenchmarkParameters} is an extension of Parameters to simplify
 * benchmarking (e.g., run the same model multiple times with different random
 * seeds).
 *
 * @category Parameters
 */
export type Parameters = {
    /**
     * An array of worker-specific parameters.  Each worker can have its own
     * parameters.  If a parameter is not specified for a worker, then the global
     * value is used.
     *
     * Note that parameter nbWorkers specifies the number of workers regardless
     * of the length of the array.
     */
    workers?: WorkerParameters[];
    /**
     * Path to the solver executable.  If not specified, then the solver is searched
     * as described in function {@link calcSolverPath}.
     *
     * Solver is an executable that is used to solve the model.  It is a separate
     * process started by the JavaScript API.
     */
    solverPath?: string;
    /**
     * The value of `usage` parameter is printed on standard output by functions
     * {@link parseParameters}, {@link parseSomeParameters}, {@link
     * parseBenchmarkParameters} and {@link parseSomeBenchmarkParameters} when the
     * user specifies `--help` or `-h` on the command line. The usage is followed
     * by the list of recognized parameters of the given function.
     */
    usage?: string;
    /**
     * Version information.  If specified, then the version is printed by
     * functions {@link parseParameters}, {@link parseSomeParameters},
     * {@link parseBenchmarkParameters} and {@link parseSomeBenchmarkParameters},
     * when the user specifies `--version` on the
     * command line.  The version is followed by the version of the solver.
     */
    version?: string;
    /**
    * Whether to colorize output to the terminal.
    *
    * This parameter controls when terminal output is colorized. Possible values are:
    *
    * *  `never`: don't colorize the output.
    * *  `auto`: colorize if the output is a supported terminal.
    * *  `always`: always colorize the output.
    *
    *
    * The default value is `Auto`.
    */
    color?: "Never" | "Auto" | "Always";
    /**
    * Number of threads dedicated to search.
    *
    * When this parameter is 0 (the default), the number of workers is determined the following way:
    *
    *  * If environment variable `OPTALCP_NB_WORKERS` is set, its value is used.
    *  * Otherwise, all available cores are used.
    *
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `0`.
    */
    nbWorkers?: number;
    /**
    * Type of search to use.
    *
    * Possible values are:
    *
    * *  `LNS`: Large Neighborhood Search
    * *  `FDS`: Failure-Directed Search
    * *  `FDSLB`: Failure-Directed Searching working on lower bound
    * *  `SetTimes`: Depth-first set-times search (not restarted)
    *
    *
    * The default value is `LNS`.
    */
    searchType?: "LNS" | "FDS" | "FDSLB" | "SetTimes";
    /**
    * Random seed.
    *
    * The solver breaks ties randomly using a pseudorandom number generator. This parameter sets the seed of the generator.
    *
    * Note that when {@link Parameters.nbWorkers} is more than 1 then there is also another source of randomness: the time it takes for a message to pass from one worker to another. Therefore with {@link Parameters.nbWorkers}=1 the solver is deterministic (random behavior depends only on random seed). With {@link Parameters.nbWorkers}>1 the solver is not deterministic.
    *
    * Even with {@link NbSeeds}=1 and the same random seed, the solver may behave differently on different platforms. This can be due to different implementations of certain functions such as `std::sort`.
    *
    * The parameter takes an unsigned integer value.
    * The default value is `1`.
    */
    randomSeed?: number;
    /**
    * Level of the log.
    *
    * This parameter controls the amount of text the solver writes on standard output. The solver is completely silent when this option is set to 0.
    *
    * The parameter takes an unsigned integer value  in range `0..3`.
    * The default value is `2`.
    */
    logLevel?: number;
    /**
    * Level of warnings.
    *
    * This parameter controls the types of warnings the solver emits. When this parameter is set to 0 then no warnings are emitted. blah blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..3`.
    * The default value is `2`.
    */
    warningLevel?: number;
    /**
    * How often to print log messages (in seconds).
    *
    * When {@link logLevel} &ge; 2 then solver writes a log message every `logPeriod` seconds. The log message contains the current statistics about the solve: number of branches, number of fails, memory used, etc.
    *
    *
    * The parameter takes a floating point value  in range `0.010000..Infinity`.
    * The default value is `10`.
    */
    logPeriod?: number;
    /**
    * When on, the correctness of solutions is verified.
    *
    * Verification is an independent algorithm that checks whether all constraints in the model are satisfied (or absent), and that objective value was computed correctly. Verification is a somewhat redundant process as all solutions should be correct. Its purpose is to double-check and detect bugs in the solver.
    *
    * The default value is `false`.
    */
    verifySolutions?: boolean;
    /**
    * The minimal amount of memory in kB for a single allocation.
    *
    * The solver allocates memory in blocks. This parameter sets the minimal size of a block. Larger blocks mean a higher risk of wasting memory. However, larger blocks may also lead to better performance, particularly when the size matches the page size supported by the operating system.
    *
    * The value of this parameter must be a power of 2.
    *
    * The default value is 2048 means 2MB, which means that up to ~12MB can be wasted per worker in the worst case.
    *
    * The parameter takes an unsigned integer value  in range `4..1073741824`.
    * The default value is `2048`.
    */
    allocationBlockSize?: number;
    /**
    * Wall clock limit for execution.
    *
    * blah blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `Infinity`.
    */
    timeLimit?: number;
    /**
    * Stop the search after the given number of solutions.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    solutionLimit?: number;
    /**
    *  @internal
    * Fail limit for each worker.
    *
    * `FailLimit` sets the maximum number of failures for each worker. By default, there is no limit.
    *
    * When one of the workers hits the limit, then it stops. Other workers may continue working (until they also hit a limit).
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerFailLimit?: number;
    /**
    *  @internal
    * Branch limit for every worker.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerBranchLimit?: number;
    /**
    *  @internal
    * Stop the worker after the given number of solutions.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerSolutionLimit?: number;
    /**
    *  @internal
    * Stop the worker after given number of LNS steps.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerLNSStepLimit?: number;
    /**
    *  @internal
    * Stop the worker after the given number of restarts.
    *
    * blah blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `18446744073709551615`.
    */
    _workerRestartLimit?: number;
    /**
    * Stop the search when the gap is below the tolerance.
    *
    * The search is stopped if the absolute difference between the current solution
    * value and current lower/upper bound is not bigger than the specified value.
    * Note that parameters `AbsoluteGapTolerance` and `RelativeGapTolerance`
    * are considered independently, i.e., the search stops if at least one of the conditions apply.
    *
    * The parameter takes a floating point value.
    * The default value is `0`.
    */
    absoluteGapTolerance?: number;
    /**
    * Stop the search when the gap is below the tolerance.
    *
    * The search is stopped if the relative difference between the current solution
    * value and current lower/upper bound is not bigger than the specified value.
    * Note that parameters `AbsoluteGapTolerance` and `RelativeGapTolerance`
    * are considered independently, i.e., the search stops if at least one of the conditions apply.
    *
    * The parameter takes a floating point value.
    * The default value is `0.0001`.
    */
    relativeGapTolerance?: number;
    /**
    * How much to propagate noOverlap constraints.
    *
    * This parameter controls the amount of propagation done for noOverlap constraints.
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * More propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..4`.
    * The default value is `2`.
    */
    noOverlapPropagationLevel?: number;
    /**
    * How much to propagate constraints on cumul functions.
    *
    * This parameter controls the amount of propagation done for {@link Model.cumulLe} constraint when used with a sum of {@link Model.pulse | pulses}.
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * More propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..3`.
    * The default value is `1`.
    */
    cumulPropagationLevel?: number;
    /**
    * How much to propagate constraints on cumul functions.
    *
    * This parameter controls the amount of propagation done for {@link Model.cumulLe} and {@link Model.cumulGe} when used together with steps ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}).
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * More propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..2`.
    * The default value is `1`.
    */
    reservoirPropagationLevel?: number;
    /**
    * How much to propagate position expressions on noOverlap constraints.
    *
    * This parameter controls the amount of propagation done for position expressions on noOverlap constraints.
    * The bigger the value, the more algorithms are used for propagation.
    * It means that more time is spent by the propagation, and possibly more values are removed from domains.
    * However, more propagation doesn't necessarily mean better performance.
    * FDS search (see {@link searchType}) usually benefits from higher propagation levels.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..3`.
    * The default value is `2`.
    */
    positionPropagationLevel?: number;
    /**
    * How much to propagate stepFunctionSum expression.
    *
    * This parameter controls the amount of propagation done for {@link Model.stepFunctionSum} expressions.
    * In particular, it controls whether the propagation also affects the minimum and the maximum length of the associated interval variable:
    *
    * * `1`: The length is updated only once during initial constraint propagation.
    * * `2`: The length is updated every time the expression is propagated.
    *
    *
    * The parameter takes an unsigned integer value  in range `1..2`.
    * The default value is `1`.
    */
    stepFunctionSumPropagationLevel?: number;
    /**
    * Whether to use precedence energy propagation algorithm.
    *
    * Precedence energy algorithm improves propagation of precedence constraints when an interval has multiple predecessors (or successors). which use the same resource (noOverlap or cumulative constraint). In this case, the predecessors (or successors) may be in disjunction. Precedence energy algorithm can leverage this information and propagate the precedence constraint more aggressively.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..1`.
    * The default value is `0`.
    */
    usePrecedenceEnergy?: number;
    /**
    * Level of search trace.
    *
    * This parameter is available only in the development edition of the solver.
    *
    * When set to a value bigger than zero, the solver prints a trace of the search.
    * The trace contains information about every choice taken by the solver.
    * The higher the value, the more information is printed.
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    searchTraceLevel?: number;
    /**
    * Level of propagation trace.
    *
    * This parameter is available only in the development edition of the solver.
    *
    * When set to a value bigger than zero, the solver prints a trace of the propagation,
    * that is a line for every domain change.
    * The higher the value, the more information is printed.
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    propagationTraceLevel?: number;
    /**
    * Level of information trace.
    *
    * This parameter is available only in the development edition of the solver.
    *
    * When set to a value bigger than zero, the solver prints various high-level information.
    * The higher the value, the more information is printed.
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    infoTraceLevel?: number;
    /**
    * Initial rating for newly created choices.
    *
    * Default rating for newly created choices. Both left and right branches get the same rating.
    * Choice is initially permuted so that bigger domain change is the left branch.
    *
    * The parameter takes a floating point value  in range `0.000000..2.000000`.
    * The default value is `0.5`.
    */
    fdsInitialRating?: number;
    /**
    * Weight of the reduction factor in rating computation.
    *
    * When computing the local rating of a branch, multiply reduction factor by the given weight.
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `1`.
    */
    fdsReductionWeight?: number;
    /**
    * Length of average rating computed for choices.
    *
    * For the computation of rating of a branch. Arithmetic average is used until the branch
    * is taken at least FDSRatingAverageLength times. After that exponential moving average
    * is used with parameter alpha = 1 - 1 / FDSRatingAverageLength.
    *
    * The parameter takes an integer value  in range `0..254`.
    * The default value is `25`.
    */
    fdsRatingAverageLength?: number;
    /**
    * When non-zero, alpha factor for rating updates.
    *
    * When this parameter is set to a non-zero, parameter FDSRatingAverageLength is ignored.
    * Instead, the rating of a branch is computed as an exponential moving average with the given parameter alpha.
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0`.
    */
    fdsFixedAlpha?: number;
    /**
    * Whether to compare the local rating with the average.
    *
    * Possible values are:
    *
    *  * `Off` (the default): No comparison is done.
    *  * `Global`: Compare with the global average.
    *  * `Depth`: Compare with the average on the current search depth
    *
    * Arithmetic average is used for global and depth averages.
    *
    * The default value is `Off`.
    */
    fdsRatingAverageComparison?: "Off" | "Global" | "Depth";
    /**
    * Reduction factor R for rating computation.
    *
    * Possible values are:
    *
    *  * `Normal` (the default): Normal reduction factor.
    *  * `Zero`: Factor is not used (it is 0 all the time).
    *  * `Random`: A random number in the range [0,1] is used instead.
    *
    *
    * The default value is `Normal`.
    */
    fdsReductionFactor?: "Normal" | "Zero" | "Random";
    /**
    * Whether always reuse closing choice.
    *
    * Most of the time, FDS reuses closing choice automatically. This parameter enforces it all the time.
    *
    * The default value is `false`.
    */
    fdsReuseClosing?: boolean;
    /**
    * Whether all initial choices have the same step length.
    *
    * When set, then initial choices generated on interval variables will have the same step size.
    *
    * The default value is `true`.
    */
    fdsUniformChoiceStep?: boolean;
    /**
    * Choice step relative to average length.
    *
    * Ratio of initial choice step size to the minimum length of interval variable.When FDSUniformChoiceStep is set, this ratio is used to compute global choice step using the average of interval var length.When FDSUniformChoiceStep is not set, this ratio is used to compute the choice step for every interval var individually.
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `0.699999988079071`.
    */
    fdsLengthStepRatio?: number;
    /**
    * Maximum number of choices generated initially per a variable.
    *
    * Initial domains are often very large (e.g., `0..IntervalMax`). Therefore initial
    * number of generated choices is limited: only choices near startMin are kept.
    *
    * The parameter takes an unsigned integer value  in range `2..2147483647`.
    * The default value is `90`.
    */
    fdsMaxInitialChoicesPerVariable?: number;
    /**
    * Domain split ratio when run out of choices.
    *
    * When all choices are decided, and a greedy algorithm cannot find a solution, then
    * more choices are generated by splitting domains into the specified number of pieces.
    *
    * The parameter takes a floating point value  in range `2.000000..Infinity`.
    * The default value is `7`.
    */
    fdsAdditionalStepRatio?: number;
    /**
    * Whether to generate choices on presence status.
    *
    * Choices on start time also include a choice on presence status. Therefore, dedicated choices on presence status only are not mandatory.
    *
    * The default value is `true`.
    */
    fdsPresenceStatusChoices?: boolean;
    /**
    * Maximum step when generating initial choices for integer variables..
    *
    * For a variable with big initial domains, choices are generated only around min value considering the given step.
    *
    * The parameter takes an unsigned integer value  in range `1..1073741823`.
    * The default value is `107374182`.
    */
    fdsMaxInitialIntVarChoiceStep?: number;
    /**
    * Influence of event time to initial choice rating.
    *
    * When non-zero, the initial choice rating is influenced by the date of the choice.
    * This way, very first choices in the search should be taken chronologically.
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0`.
    */
    fdsEventTimeInfluence?: number;
    /**
    * How much to improve rating when both branches fail immediately.
    *
    * This parameter sets a bonus reward for a choice when both left and right branches fail immediately.
    * Current rating of both branches is multiplied by the specified value.
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.98`.
    */
    fdsBothFailRewardFactor?: number;
    /**
    * How often to chose a choice randomly.
    *
    * Probability that a choice is taken randomly. A randomly selected choice is not added to the search tree automatically. Instead, the choice is tried, its rating is updated,
    * but it is added to the search tree only if one of the branches fails.
    * The mechanism is similar to strong branching.
    *
    * The parameter takes a floating point value  in range `0.000000..0.999990`.
    * The default value is `0.1`.
    */
    fdsEpsilon?: number;
    /**
    * Number of choices to try in strong branching.
    *
    * Strong branching means that instead of taking a choice with the best rating,
    * we take the specified number (FDSStrongBranchingSize) of best choices,
    * try them in dry-run mode, measure their local rating, and
    * then chose the one with the best local rating.
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `10`.
    */
    fdsStrongBranchingSize?: number;
    /**
    * Up-to what search depth apply strong branching.
    *
    * Strong branching is typically used in the root node. This parameter controls
    * the maximum search depth when strong branching is used.
    *
    * The parameter takes an unsigned integer value.
    * The default value is `6`.
    */
    fdsStrongBranchingDepth?: number;
    /**
    * How to choose the best choice in strong branching.
    *
    * Possible values are:
    *
    * * `Both`: Choose the the choice with best combined rating.
    * * `Left` (the default): Choose the choice with the best rating of the left branch.
    * * `Right`: Choose the choice with the best rating of the right branch.
    *
    *
    * The default value is `Left`.
    */
    fdsStrongBranchingCriterion?: "Both" | "Left" | "Right";
    /**
    * Fail limit for the first restart.
    *
    * Failure-directed search is periodically restarted: explored part of the current search tree is turned into a no-good constraint, and the search starts again in the root node.
    * This parameter specifies the size of the very first search tree (measured in number of failures).
    *
    * The parameter takes an unsigned integer value  in range `1..9223372036854775807`.
    * The default value is `100`.
    */
    fdsInitialRestartLimit?: number;
    /**
    * Restart strategy to use.
    *
    * This parameter specifies how the restart limit (maximum number of failures) changes from restart to restart.
    * Possible values are:
    *
    * * `Geometric` (the default): After each restart, restart limit is multiplied by {@link fdsRestartGrowthFactor}.
    * * `Nested`: Similar to `Geometric` but the limit is changed back to {@link fdsInitialRestartLimit} each time a new maximum limit is reached.
    * * `Luby`: Luby restart strategy is used. Parameter {@link fdsRestartGrowthFactor} is ignored.
    *
    * The default value is `Geometric`.
    */
    fdsRestartStrategy?: "Geometric" | "Nested" | "Luby";
    /**
    * Growth factor for fail limit after each restart.
    *
    * After each restart, the fail limit for the restart is multiplied by the specified factor.
    * This parameter is ignored when {@link fdsRestartStrategy} is `Luby`.
    *
    * The parameter takes a floating point value  in range `1.000000..Infinity`.
    * The default value is `1.15`.
    */
    fdsRestartGrowthFactor?: number;
    /**
    * Truncate choice use counts after a restart to this value.
    *
    * The idea is that ratings learned in the previous restart are less valid in the new restart.
    * Using this parameter, it is possible to truncate use counts on choices so that new local ratings will have bigger weights (when FDSFixedAlpha is not used).
    *
    * The parameter takes an unsigned integer value.
    * The default value is `255`.
    */
    fdsMaxCounterAfterRestart?: number;
    /**
    * Truncate choice use counts after a solution is found.
    *
    * Similar to `FDSMaxCounterAfterRestart`, this parameter allows truncating use counts on choices when a solution is found.
    *
    * The parameter takes an unsigned integer value.
    * The default value is `255`.
    */
    fdsMaxCounterAfterSolution?: number;
    /**
    * Reset restart size after a solution is found (ignored in Luby).
    *
    * When this parameter is set (the default), then restart limit is set back to `FDSInitialRestartLimit` when a solution is found.
    *
    * The default value is `true`.
    */
    fdsResetRestartsAfterSolution?: boolean;
    /**
    * Whether to use or not nogood constraints.
    *
    * By default, no-good constraint is generated after each restart. This parameter allows to turn no-good constraints off.
    *
    * The default value is `true`.
    */
    fdsUseNogoods?: boolean;
    /**
    *  @internal
    * Whether to freeze ratings after a proof is found.
    *
    *
    *
    * The default value is `false`.
    */
    _fdsFreezeRatingsAfterProof?: boolean;
    /**
    *  @internal
    * Whether to continue after proof.
    *
    *
    *
    * The default value is `false`.
    */
    _fdsContinueAfterProof?: boolean;
    /**
    *  @internal
    * How many times repeat the proof.
    *
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `1`.
    */
    _fdsRepeatLimit?: number;
    /**
    *  @internal
    * Choose completely randomly.
    *
    *
    *
    * The default value is `false`.
    */
    _fdsCompletelyRandom?: boolean;
    /**
    * Whether to generate choices for objective expression/variable.
    *
    * This option controls the generation of choices on the objective. It works regardless of the objective is given by an expression or a variable.
    *
    * The default value is `false`.
    */
    fdsBranchOnObjective?: boolean;
    /**
    *  @internal
    * Whether to improve nogoods from FDS.
    *
    *
    *
    * The default value is `true`.
    */
    _fdsImproveNogoods?: boolean;
    /**
    * A strategy to choose objective cuts during FDSLB search..
    *
    * Possible values are:
    *
    * * `Minimum`: Always change the cut by the minimum amount. The default value.
    * * `Random`: At each restart, randomly choose a value in range LB..UB.
    * * `Split`: Always split the current range LB..UB in half.
    *
    *
    * The default value is `Minimum`.
    */
    fdsLBStrategy?: "Minimum" | "Random" | "Split";
    /**
    * Whether to reset ratings when a new LB is proved.
    *
    * When this parameter is on, and FDSLB proves a new lower bound, then all ratings are reset to default values.
    *
    * The default value is `false`.
    */
    fdsLBResetRatings?: boolean;
    /**
    *  @internal
    * Initial fail limit in first solution phase (after 0 fails).
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `1..18446744073709551615`.
    * The default value is `100`.
    */
    _lnsFirstFailLimit?: number;
    /**
    *  @internal
    * How much to increase fail limit during first solution phase.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `1.000000..Infinity`.
    * The default value is `2`.
    */
    _lnsFailLimitGrowthFactor?: number;
    /**
    *  @internal
    * Multiply fail limit for LNS steps by this number.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `60`.
    */
    _lnsFailLimitCoefficient?: number;
    /**
    *  @internal
    * Number of all-heuristic iterations after the first solution.
    *
    * If this number is -1 then the initial solution search ends as soon as the first solution is found.If it is 0, then the current iteration is finished. Otherwise, the given number of additional iterations is performed.
    *
    * The parameter takes an integer value  in range `-1..2147483647`.
    * The default value is `1`.
    */
    _lnsIterationsAfterFirstSolution?: number;
    /**
    *  @internal
    * Whether to use aggressive SetTimes dominance during LNS.
    *
    *
    *
    * The default value is `true`.
    */
    _lnsAggressiveDominance?: boolean;
    /**
    *  @internal
    * Probability to choose differently than by the heuristic.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `0`.
    */
    _lnsViolateHeuristicsProbability?: number;
    /**
    *  @internal
    * How many times iterate on the current solution (unless new one is found).
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `1..2147483647`.
    * The default value is `5`.
    */
    _lnsSameSolutionPeriod?: number;
    /**
    *  @internal
    * Number of best solutions that receive most attention.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `1..1000`.
    * The default value is `1`.
    */
    _lnsTier1Size?: number;
    /**
    *  @internal
    * How many worse solutions to remember and sometimes work on.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1000`.
    * The default value is `7`.
    */
    _lnsTier2Size?: number;
    /**
    *  @internal
    * How many other solutions to remember.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1000`.
    * The default value is `10`.
    */
    _lnsTier3Size?: number;
    /**
    *  @internal
    * Probability to work on a solution from tier 2.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `0.1`.
    */
    _lnsTier2Effort?: number;
    /**
    *  @internal
    * Probability to work on a solution from tier 3.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `0.05`.
    */
    _lnsTier3Effort?: number;
    /**
    *  @internal
    * Probability to accept a solution with the same objective value.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..1.000000`.
    * The default value is `1`.
    */
    _lnsProbabilityAcceptSameObjective?: number;
    /**
    *  @internal
    * Multiplication factor to affect fail limit of every LNS step.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `1`.
    */
    _lnsStepFailLimitFactor?: number;
    /**
    *  @internal
    * How often apply objective cut in LNS steps.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.333333333333333`.
    */
    _lnsApplyCutProbability?: number;
    /**
    *  @internal
    * What POS generation algorithm to use for discrete resource.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1`.
    * The default value is `0`.
    */
    _lnsDiscretePOSAlgorithm?: number;
    /**
    *  @internal
    * What POS generation algorithm to use for reservoir.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..1`.
    * The default value is `0`.
    */
    _lnsReservoirPOSAlgorithm?: number;
    /**
    *  @internal
    * Maximum size of a model part considered for structure detection.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..10`.
    * The default value is `4`.
    */
    _lnsSmallStructureLimit?: number;
    /**
    *  @internal
    * Maximum size of an alternative with for O(n^2) structure links.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `0`.
    */
    _lnsStructureAlternativeLimit?: number;
    /**
    *  @internal
    * Probability to chose heuristics randomly.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.2`.
    */
    _lnsHeuristicsEpsilon?: number;
    /**
    *  @internal
    * Learning coefficient for heuristics.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.1`.
    */
    _lnsHeuristicsAlpha?: number;
    /**
    *  @internal
    * Initial Q-values of all heuristics.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `1`.
    */
    _lnsHeuristicsInitialQ?: number;
    /**
    *  @internal
    * Probability to chose portions to relax randomly.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.2`.
    */
    _lnsPortionEpsilon?: number;
    /**
    *  @internal
    * Learning coefficient for portions to relax.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.1`.
    */
    _lnsPortionAlpha?: number;
    /**
    *  @internal
    * Initial Q-values of portions to relax.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `1`.
    */
    _lnsPortionInitialQ?: number;
    /**
    *  @internal
    * Limit for portions to relax that are considered big and used less often.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0.2`.
    */
    _lnsPortionHandicapLimit?: number;
    /**
    *  @internal
    * Relative probability to use handicapped portions to relax.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value  in range `0..100`.
    * The default value is `10`.
    */
    _lnsPortionHandicapValue?: number;
    /**
    *  @internal
    * Initial Q-values of handicapped portions to relax.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0..1`.
    * The default value is `0`.
    */
    _lnsPortionHandicapInitialQ?: number;
    /**
    *  @internal
    * How many dives before switching to normal LNS.
    *
    * blah blah
    *
    * The parameter takes an unsigned integer value.
    * The default value is `20`.
    */
    _lnsDivingLimit?: number;
    /**
    *  @internal
    * Diving fail limit compared to final first solution fail limit.
    *
    * blah blah
    *
    * The parameter takes a floating point value  in range `0.000000..Infinity`.
    * The default value is `1`.
    */
    _lnsDivingFailLimitRatio?: number;
    /**
    * Which worker computes simple lower bound.
    *
    * Simple lower bound is a bound such that infeasibility of a better objective can be proved by propagation only (without the search). The given worker computes simple lower bound before it starts the normal search. If a worker with the given number doesn't exist, then the lower bound is not computed.
    *
    * The parameter takes an integer value  in range `-1..2147483647`.
    * The default value is `0`.
    */
    simpleLBWorker?: number;
    /**
    * Maximum number of feasibility checks.
    *
    * Simple lower bound is computed by binary search for the best objective value that is not infeasible by propagation. This parameter limits the maximum number of iterations of the binary search. When the value is 0, then simple lower bound is not computed at all.
    *
    * The parameter takes an unsigned integer value  in range `0..2147483647`.
    * The default value is `2147483647`.
    */
    simpleLBMaxIterations?: number;
    /**
    * Number of shaving rounds.
    *
    * When non-zero, the solver shaves on variable domains to improve the lower bound. This parameter controls the number of shaving rounds.
    *
    * The parameter takes an unsigned integer value  in range `0..2147483647`.
    * The default value is `0`.
    */
    simpleLBShavingRounds?: number;
    /**
    *  @internal
    * Level of internal trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `1`.
    */
    _debugTraceLevel?: number;
    /**
    *  @internal
    * Level of memory trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _memoryTraceLevel?: number;
    /**
    *  @internal
    * Addition internal propagation trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _propagationDetailTraceLevel?: number;
    /**
    *  @internal
    * Level of SetTimes trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _setTimesTraceLevel?: number;
    /**
    *  @internal
    * Trace messages between master and workers.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _communicationTraceLevel?: number;
    /**
    *  @internal
    * Level of presolve trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _presolveTraceLevel?: number;
    /**
    *  @internal
    * Level of conversion trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _conversionTraceLevel?: number;
    /**
    *  @internal
    * Trace creation of expressions in the engine.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _expressionBuilderTraceLevel?: number;
    /**
    *  @internal
    * Level of Memorization trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _memorizationTraceLevel?: number;
    /**
    *  @internal
    * Additional internal search trace.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _searchDetailTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for Failure-Directed Search.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _fdsTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for shaving.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _shavingTraceLevel?: number;
    /**
    *  @internal
    * Internal trace that dumps ratings of FDS choices.
    *
    * It prints information from Failure-Directed Search in a CSV form suitable for further data processing. Choices are always dumped in the same way regardless of whether it is currently swapped (i.e., regardless of which branch is currently left and right). For this reason, the branches are called *positive* and *negative* instead.
    *
    * An ID of a choice is the following triple:
    *
    * * Variable
    * * Type
    * * Splitting point
    *
    * Using this triple, it is possible to track an individual choice during the log.
    *
    * The log prints three kinds of data rows:
    *
    * * `ChoiceAfterRestart`: After each restart, one row per still an active choice. Level 1.
    * * `StatsAfterRestart`: Current global statistics after restart (one row). Level 1.
    * * `AfterBranchEvaluated`: One row each time after a rating is changed. Includes
    *   actual local rating. Level 2.
    * * `Graph`: statistics about different depths of the search tree. Level 1.
    *   This information is included only if FDS_STATISTICS is defined in `fds.hpp`.
    *
    * At the beginning of the log, there is one descriptive header line for each kind of event.
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _fdsRatingsTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for Large Neighborhood Search.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _lnsTraceLevel?: number;
    /**
    *  @internal
    * Internal trace for heuristic replay.
    *
    *
    *
    * The parameter takes an unsigned integer value  in range `0..5`.
    * The default value is `0`.
    */
    _heuristicReplayTraceLevel?: number;
    /**
    *  @internal
    * Whether to allow (optimality) proofs by SetTimes.
    *
    * blah blah
    *
    * The default value is `false`.
    */
    _allowSetTimesProofs?: boolean;
    /**
    *  @internal
    * Always use aggressive dominance rules in SetTimes.
    *
    *
    *
    * The default value is `false`.
    */
    _setTimesAggressiveDominance?: boolean;
    /**
    *  @internal
    * Coefficient for computation of the number of extends in SetTimes.
    *
    *
    *
    * The parameter takes a floating point value.
    * The default value is `0.8`.
    */
    _setTimesExtendsCoef?: number;
    /**
    *  @internal
    * Maximum capacity to use low-capacity timetable algorithm.
    *
    *
    *
    * The parameter takes an integer value  in range `0..16`.
    * The default value is `16`.
    */
    _discreteLowCapacityLimit?: number;
    /**
    *  @internal
    * Objective value to start LNS training.
    *
    *
    *
    * The parameter takes a floating point value.
    * The default value is `-Infinity`.
    */
    _lnsTrainingObjectiveLimit?: number;
    /**
    *  @internal
    * Whether to ignore non-touching tasks when generating POS.
    *
    *
    *
    * The default value is `false`.
    */
    _lnsWeakerPOS?: boolean;
    /**
    *  @internal
    * Do not relink POS when an interval variable is relaxed.
    *
    *
    *
    * The default value is `false`.
    */
    _lnsDontRelinkPOS?: boolean;
    /**
    *  @internal
    * Default size of CallbackBlock. Must be multiple of 8..
    *
    *
    *
    * The parameter takes an unsigned integer value.
    * The default value is `128`.
    */
    _defaultCallbackBlockSize?: number;
};
/**
 * This function creates a deep copy of the input {@link Parameters} object.
 * Afterwards, the copy can be modified without affecting
 * the original {@link Parameters} object.
 *
 * @param params The {@link Parameters} object to copy.
 * @returns A deep copy of the input {@link Parameters} object.
 *
 * @category Parameters
 */
export declare function copyParameters(params: Parameters): Parameters;
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
 */
export declare function combineParameters(source: Parameters, modifications: Parameters): Parameters;
/** @internal */
export declare const ParametersHelp: string;
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
 * In case of an error (e.g.
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
 * {@link WorkerParameters} can be specified for individual workers using `--workerN.` prefix.
 * For example, `--worker0.searchType FDS` sets the search type to the first worker only.
 *
 * @see This function does not accept any unrecognized arguments. See function
 * {@link parseSomeParameters} to handle unrecognized arguments differently.
 *
 * @see See {@link parseBenchmarkParameters} and {@link parseSomeBenchmarkParameters} for
 *    functions that parse {@link BenchmarkParameters}.
 *
 * @category Parameters
 */
export declare function parseParameters(params?: Parameters, args?: string[]): Parameters;
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
 * @category Parameters
 */
export declare function parseSomeParameters(params: Parameters, args?: string[]): string[];
/** @internal (could be made public later) */
export type IntervalVarValue = null | {
    start: number;
    end: number;
};
/**
 * Objective value of the solution. The model can specify an objective to {@link
 * Model.minimize} or {@link Model.maximize}. When a solution is found, the
 * value of the objective is stored in this object.
 *
 * If the model did not specify an objective, then _ObjectiveValue_ is undefined.
 * Objective value is _absent_ (see optional {@link IntExpr}) is
 * translated into JavaScript _null_.
 *
 * In the case of multi-objective optimization (not implemented), this object
 * contains an array of individual objective values.
 *
 * @see {@link Model.minimize}, {@link Model.maximize}
 * @see {@link SolveResult}
 * @see {@link Solution}
 *
 * @category Solving
 */
export type ObjectiveValue = undefined | number | null | Array<number | null>;
/** @internal */
type SolutionVarValues = Array<{
    id: number;
    value: null | number | {
        start: number;
        end: number;
    };
}>;
/** @internal */
type SerializedSolution = {
    values: SolutionVarValues;
    objective: ObjectiveValue;
};
/**
 * An event emitted by {@link Solver} when a solution is found.
 *
 * The event can be intercepted by calling
 * {@link Solver.on | Solver.on('solution', ...)}.
 * The event contains the solution, solving time so far, and the result of
 * solution verification.
 *
 * @see {@link Solver}
 * @see {@link Solver.on | Solver.on('solution', ...)}
 *
 * @category Solving
 */
export type SolutionEvent = {
    /** The duration of the solve at the time the solution was found, in seconds. */
    solveTime: number;
    /**
     * Result of the verification of the solution.
     *
     * When parameter {@link Parameters.verifySolutions} is set to true (the
     * default), then the solver verifies all solutions found. The
     * verification checks that all constraints in the model are satisfied and
     * that the objective value is computed correctly.
     *
     * The verification is done using a separate code (not used during the
     * search).  The point is to independently verify the correctness of the
     * solution.
     *
     * Possible values are:
     *
     *  * `undefined` - the solution was not verified (because the parameter
     *    {@link Parameters.verifySolutions} was not set).
     * * `true` - the solution was verified and correct.
     *
     * The value can never be `false` because, in that case, the solver ends with an
     * error.
     */
    valid?: true | undefined;
    /**
     * Solution of the model.
     *
     * The solution contains values of all variables in the model (including
     * optional variables) and the value of the objective (if the model specified
     * one).
     *
     * Note that in the evaluation version of OptalCP, the values of variables in
     * the solution are masked and replaced by value _absent_ (`null` in
     * JavaScript).
     */
    solution: Solution;
};
/**
 * An event that is emitted by {@link Solver} when a new (i.e. better) lower
 * bound of the objective is found.
 *
 * The event can be intercepted by calling
 * {@link Solver.on |  Solver.on("lower bound", ...)} with `"lowerBound"` event name.
 * The event contains the new lower bound and the solving time so far.
 *
 * @see {@link Solver}
 * @see {@link Solver.on | Solver.on("lowerBound", ...)}
 *
 * @category Solving
 */
export type LowerBoundEvent = {
    /** Duration of the solve at the time the lower bound was found, in seconds. */
    solveTime: number;
    /** The new lower bound of the objective. */
    value: ObjectiveValue;
};
/**
 * Solution of a {@link Model}. When a model is solved, the solution is stored
 * in this object. The solution contains values of all variables in the model
 * (including optional variables) and the value of the objective (if the model
 * specified one).
 *
 * ### Evaluation version of OptalCP
 *
 * Note that in the evaluation version of OptalCP, the values of variables in
 * the solution are masked and replaced by value _absent_ (`null` in JavaScript).
 *
 * @category Solving
 */
export declare class Solution {
    #private;
    /**
     * Creates an empty solution. That is, all variables are absent, and the
     * objective value is _undefined_.
     *
     * Use this function to create an external solution that can be passed to
     * the solver before the solve starts as a _warmStart_ (see {@link solve},
     * {@link Solver}) or during the solve using {@link Solver.sendSolution}.
     */
    constructor();
    /** @internal (read from a message sent by the solver) */
    _init(msg: SerializedSolution): void;
    /**
     * Returns the objective value of the solution. If the model did not specify an
     * objective returns _undefined_. If the objective value is _absent_
     * (see optional {@link IntExpr}) then it returns _null_.
     *
     * The correct value is reported even in the evaluation version of OptalCP.
     */
    getObjective(): ObjectiveValue;
    /**
     * Returns true if the given variable is present in the solution, i.e., if its
     * value is not _absent_.  See optional {@link IntervalVar}.
     *
     * In the evaluation version of OptalCP, this function always returns `false`
     * because real values of variables are masked and replaced by value _absent_.
     */
    isPresent(variable: IntervalVar): boolean;
    /** @internal */
    isPresent(variable: BoolVar | IntVar | FloatVar): boolean;
    /**
     * Returns true if the given variable is absent in the solution, i.e., if its
     * value is _absent_.  See optional {@link IntervalVar}.
     *
     * In the evaluation version of OptalCP, this function always returns `true`
     * because real values of variables are masked and replaced by value _absent_.
     */
    isAbsent(variable: IntervalVar): boolean;
    /** @internal */
    isAbsent(variable: BoolVar | IntVar | FloatVar): boolean;
    /** @internal */
    getValue(variable: BoolVar): boolean | null;
    /** @internal */
    getValue(variable: IntVar | FloatVar): number | null;
    /** @internal */
    getValue(variable: IntervalVar): IntervalVarValue;
    /**
     * Returns the start of the given interval variable in the solution.
     * If the variable is absent in the solution, it returns _null_.
     *
     * In the evaluation version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value _absent_.
     */
    getStart(variable: IntervalVar): number | null;
    /**
     * Returns the end of the given interval variable in the solution.
     * If the variable is absent in the solution, it returns _null_.
     *
     * In the evaluation version of OptalCP, this function always returns `null`
     * because real values of variables are masked and replaced by value _absent_.
     */
    getEnd(variable: IntervalVar): number | null;
    /**
     * Sets objective value of the solution.
     *
     * This function
     * can be used for construction of an external solution that can be passed to
     * the solver (see {@link solve}, {@link Solver} and {@link
     * Solver.sendSolution}).
     */
    setObjective(value: ObjectiveValue): void;
    /** @internal */
    setAbsent(boolVar: BoolVar): void;
    /** @internal */
    setAbsent(intVar: IntVar): void;
    /**
     * Sets the given variable to be absent in the solution.
     *
     * This function
     * can be used for construction of an external solution that can be passed to
     * the solver (see {@link solve}, {@link Solver} and {@link
     * Solver.sendSolution}).
     */
    setAbsent(intervalVar: IntervalVar): void;
    /** @internal */
    setValue(boolVar: BoolVar, value: boolean): void;
    /** @internal */
    setValue(intVar: IntVar, value: number): void;
    /** @internal */
    setValue(floatVar: FloatVar, value: number): void;
    /**
     * Sets the start and end of the given interval variable in the solution. I.e., the
     * interval variable will be present in the solution.
     *
     * This function
     * can be used for construction of an external solution that can be passed to
     * the solver (see {@link solve}, {@link Solver} and {@link
     * Solver.sendSolution}).
     */
    setValue(intervalVar: IntervalVar, start: number, end: number): void;
    /** @internal */
    _serialize(): SerializedSolution;
}
/** @internal */
type NumVarRange = {
    presence: PresenceStatus;
    min?: number;
    max?: number;
};
/** @internal */
type IntervalVarDomain = {
    presence: PresenceStatus;
    startMin?: number;
    startMax?: number;
    endMin?: number;
    endMax?: number;
    lengthMin?: number;
    lengthMax?: number;
};
/** @internal */
type SerializedDomain = {
    id: number;
    domain: NumVarRange | IntervalVarDomain;
};
/** @internal */
type SerializedModelDomains = Array<SerializedDomain> | null;
/**
 *  @internal
 * Event is what solver sends us as a JSON message
 */
type DomainsEvent = {
    error: false;
    infeasible: boolean;
    limitHit: boolean;
    duration: number;
    memoryUsed: number;
    nbIntVars: number;
    nbIntervalVars: number;
    nbConstraints: number;
    domains: SerializedModelDomains;
};
/**
 * @internal
 *
 * Result of constraint propagation (see {@link propagate}).
 *
 * This object contains the result of constraint propagation: variable domains,
 * duration of the propagation, number of variables, etc.
 *
 * The propagation can also recognize that the model is infeasible. In this case
 * the property {@link PropagationResult.domains} is set to `"infeasible"`.
 * The propagation can also finish by a limit. In this case {@link PropagationResult.domains} is
 * set to "limit".
 *
 * @category Propagation
 */
export type PropagationResult = {
    /** The duration of the propagation is in seconds. */
    duration: number;
    /** The amount of memory used by the solver for propagation. In bytes.*/
    memoryUsed: number;
    /** @internal Number of integer variables in the input model. */
    nbIntVars: number;
    /** Number of interval variables in the input model. */
    nbIntervalVars: number;
    /** Number of constraints in the input model. */
    nbConstraints: number;
    /**
     * Variable domains after propagation (see {@link ModelDomains}).
     * If the model is infeasible, this property is set to `"infeasible"`.
     * If the propagation was stopped because of a limit (e.g., by a time limit), then
     * this property is set to `"limit"`.
     */
    domains: "infeasible" | "limit" | ModelDomains;
};
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
export declare class ModelDomains {
    #private;
    /** @internal */
    constructor(domains: Array<SerializedDomain>);
    /**
     * Returns true if the variable is present after propagation. I.e. it cannot
     * be absent any solution. */
    isPresent(v: IntervalVar): boolean;
    /** @internal */
    isPresent(v: BoolVar | IntVar | FloatVar): boolean;
    /**
     * Returns true if the variable is absent after propagation. I.e. it must be
     * absent in all solutions (if any). */
    isAbsent(v: IntervalVar): boolean;
    /** @internal */
    isAbsent(v: BoolVar | IntVar | FloatVar): boolean;
    /** Returns true if the presence status of the variable is not decided by propagation.
     * I.e. the variable could be present or absent in a solution. */
    isOptional(v: IntervalVar): boolean;
    /** @internal */
    isOptional(v: BoolVar | IntVar | FloatVar): boolean;
    /** @internal */
    getMin(v: BoolVar | IntVar | FloatVar): number | null;
    /** @internal */
    getMax(v: BoolVar | IntVar | FloatVar): number | null;
    /**
     * Returns the minimum start time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getStartMin(v: IntervalVar): number | null;
    /**
     * Returns the maximum start time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getStartMax(v: IntervalVar): number | null;
    /**
     * Returns the minimum end time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getEndMin(v: IntervalVar): number | null;
    /**
     * Returns the maximum end time of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getEndMax(v: IntervalVar): number | null;
    /**
     * Returns the minimum length of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getLengthMin(v: IntervalVar): number | null;
    /**
     * Returns the maximum length of the variable computed by constraint propagation.
     * If the variable is absent then it returns `null`. */
    getLengthMax(v: IntervalVar): number | null;
}
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
 * Interval variables can be created by function {@link intervalVar}.
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
 *     // Note that in the evaluation version of the solver, the variable values in
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
 * @category Modeling
 */
export declare class Model {
    #private;
    /**
     * Creates a new empty model.
     *
     * Naming the model is optional.  The main purpose of the name is to
     * distinguish between different models during benchmarking (see {@link benchmark}).
     *
     * @param name Name of the model.
     */
    constructor(name?: string);
    /** @internal */
    _reusableBoolExpr(value: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _reusableIntExpr(value: IntExpr | number): IntExpr;
    /** @internal */
    _reusableFloatExpr(value: FloatExpr | number): FloatExpr;
    /**
    * Negation of the boolean expression `arg`.
    *
    * @remarks
    *
    * If the argument has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link BoolExpr.not | BoolExpr.not}. */
    not(arg: BoolExpr | boolean): BoolExpr;
    /**
    * Logical _OR_ of boolean expressions `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link BoolExpr.or | BoolExpr.or}. */
    or(arg1: BoolExpr | boolean, arg2: BoolExpr | boolean): BoolExpr;
    /**
    * Logical _AND_ of boolean expressions `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link BoolExpr.and | BoolExpr.and}. */
    and(arg1: BoolExpr | boolean, arg2: BoolExpr | boolean): BoolExpr;
    /**
    * Logical implication of two boolean expressions, that is `arg1` implies `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link BoolExpr.implies | BoolExpr.implies}. */
    implies(arg1: BoolExpr | boolean, arg2: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _eq(arg1: BoolExpr | boolean, arg2: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _ne(arg1: BoolExpr | boolean, arg2: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _nand(arg1: BoolExpr | boolean, arg2: BoolExpr | boolean): BoolExpr;
    /**
    * Creates an expression that replaces value _absent_ by a constant.
    *
    * @remarksThe resulting expression is:
    *
    * * equal to `arg` if `arg` is _present_
    * * and equal to `absentValue` otherwise (i.e. when `arg` is _absent_).
    *
    * The default value of `absentValue` is 0.
    *
    * The resulting expression is never _absent_.
    *
    * Same as {@link IntExpr.guard | IntExpr.guard}. */
    guard(arg: IntExpr | number, absentValue?: number): IntExpr;
    /**
    * Creates negation of the integer expression, i.e. `-arg`.
    *
    * @remarks
    *
    * If the value of `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link IntExpr.neg | IntExpr.neg}. */
    neg(arg: IntExpr | number): IntExpr;
    /**
    * Creates an addition of the two integer expressions, i.e. `arg1 + arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.plus | IntExpr.plus}. */
    plus(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /**
    * Creates a subtraction of the two integer expressions, i.e. `arg1 + arg2`.@remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.minus | IntExpr.minus}. */
    minus(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /**
    * Creates a multiplication of the two integer expressions, i.e. `arg1 * arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.times | IntExpr.times}. */
    times(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /**
    * Creates an integer division of the two integer expressions, i.e. `arg1 div arg2`. The division rounds towards zero.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.div | IntExpr.div}. */
    div(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /** @internal */
    _modulo(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /**
    * Constraints `arg1` and `arg2` to be identical, including their presence status.
    *
    * @remarks
    *
    * Identity is different than equality. For example, if `x` is _absent_, then `eq(x, 0)` is _absent_, but `identity(x, 0)` is _false_.
    *
    * Same as {@link IntExpr.identity | IntExpr.identity}. */
    identity(arg1: IntExpr | number, arg2: IntExpr | number): void;
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
    eq(arg1: IntExpr | number, arg2: IntExpr | number): BoolExpr;
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
    ne(arg1: IntExpr | number, arg2: IntExpr | number): BoolExpr;
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
    lt(arg1: IntExpr | number, arg2: IntExpr | number): BoolExpr;
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
    le(arg1: IntExpr | number, arg2: IntExpr | number): BoolExpr;
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
    gt(arg1: IntExpr | number, arg2: IntExpr | number): BoolExpr;
    /**
    * Creates Boolean expression `arg1` &ge; `arg2`.
    *
    * @remarksIf one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Use function {@link Model.constraint} to create a constraint from this expression.
    *
    * Same as {@link IntExpr.ge | IntExpr.ge}. */
    ge(arg1: IntExpr | number, arg2: IntExpr | number): BoolExpr;
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
    inRange(arg: IntExpr | number, lb: number, ub: number): BoolExpr;
    /** @internal */
    _notInRange(arg: IntExpr | number, lb: number, ub: number): BoolExpr;
    /**
    * Creates an integer expression which is absolute value of `arg`.
    *
    * @remarks
    *
    * If `arg` has value _absent_ then the resulting expression has also value _absent_.
    *
    * Same as {@link IntExpr.abs | IntExpr.abs}. */
    abs(arg: IntExpr | number): IntExpr;
    /**
    * Creates an integer expression which is the minimum of `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.min2 | IntExpr.min2}. See {@link Model.min | Model.min} for n-ary minimum. */
    min2(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /**
    * Creates an integer expression which is the maximum of `arg1` and `arg2`.
    *
    * @remarks
    *
    * If one of the arguments has value _absent_, then the resulting expression also has value _absent_.
    *
    * Same as {@link IntExpr.max2 | IntExpr.max2}. See {@link Model.max | Model.max} for n-ary maximum. */
    max2(arg1: IntExpr | number, arg2: IntExpr | number): IntExpr;
    /** @internal */
    _square(arg: IntExpr | number): IntExpr;
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
    sum(args: (IntExpr | number)[]): IntExpr;
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
    max(args: (IntExpr | number)[]): IntExpr;
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
    min(args: (IntExpr | number)[]): IntExpr;
    /** @internal */
    _intPresentLinearExpr(coefficients: number[], expressions: (IntExpr | number)[], constantTerm?: number): IntExpr;
    /** @internal */
    _intOptionalLinearExpr(coefficients: number[], expressions: (IntExpr | number)[], constantTerm?: number): IntExpr;
    /** @internal */
    _count(expressions: (IntExpr | number)[], value: number): IntExpr;
    /** @internal */
    _element(array: number[], subscript: IntExpr | number): IntExpr;
    /** @internal */
    _exprElement(expressions: (IntExpr | number)[], subscript: IntExpr | number): IntExpr;
    /** @internal */
    _floatIdentity(arg1: FloatExpr | number, arg2: FloatExpr | number): void;
    /** @internal */
    _floatGuard(arg: FloatExpr | number, absentValue?: number): FloatExpr;
    /** @internal */
    _floatNeg(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatPlus(arg1: FloatExpr | number, arg2: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMinus(arg1: FloatExpr | number, arg2: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatTimes(arg1: FloatExpr | number, arg2: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatDiv(arg1: FloatExpr | number, arg2: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatEq(arg1: FloatExpr | number, arg2: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatNe(arg1: FloatExpr | number, arg2: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLt(arg1: FloatExpr | number, arg2: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLe(arg1: FloatExpr | number, arg2: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGt(arg1: FloatExpr | number, arg2: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGe(arg1: FloatExpr | number, arg2: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatInRange(arg: FloatExpr | number, lb: number, ub: number): BoolExpr;
    /** @internal */
    _floatNotInRange(arg: FloatExpr | number, lb: number, ub: number): BoolExpr;
    /** @internal */
    _floatAbs(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatSquare(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMin2(arg1: FloatExpr | number, arg2: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMax2(arg1: FloatExpr | number, arg2: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatSum(args: (FloatExpr | number)[]): FloatExpr;
    /** @internal */
    _floatMax(args: (FloatExpr | number)[]): FloatExpr;
    /** @internal */
    _floatMin(args: (FloatExpr | number)[]): FloatExpr;
    /** @internal */
    _floatPresentLinearExpr(coefficients: number[], expressions: (FloatExpr | number)[], constantTerm: number): FloatExpr;
    /** @internal */
    _floatOptionalLinearExpr(coefficients: number[], expressions: (FloatExpr | number)[], constantTerm: number): FloatExpr;
    /** @internal */
    _floatElement(array: number[], subscript: IntExpr | number): FloatExpr;
    lexLe(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): void;
    lexLt(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): void;
    lexGe(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): void;
    lexGt(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): void;
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
    startOf(interval: IntervalVar): IntExpr;
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
    endOf(interval: IntervalVar): IntExpr;
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
    lengthOf(interval: IntervalVar): IntExpr;
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
    startOr(interval: IntervalVar, absentValue: number): IntExpr;
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
    endOr(interval: IntervalVar, absentValue: number): IntExpr;
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
    lengthOr(interval: IntervalVar, absentValue: number): IntExpr;
    /** @internal */
    _overlapLength(interval1: IntervalVar, interval2: IntervalVar): IntExpr;
    /** @internal */
    _alternativeCost(main: IntervalVar, options: IntervalVar[], weights: number[]): IntExpr;
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
    endBeforeEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    endBeforeStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    startBeforeEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    startBeforeStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    endAtEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    endAtStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    startAtEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    startAtStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): void;
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
    alternative(main: IntervalVar, options: IntervalVar[]): void;
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
    span(main: IntervalVar, covered: IntervalVar[]): void;
    /** @internal */
    _noOverlap(sequence: SequenceVar, transitions?: number[][]): void;
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
    position(interval: IntervalVar, sequence: SequenceVar): IntExpr;
    /** @internal */
    _sameSequence(sequence1: SequenceVar, sequence2: SequenceVar): void;
    /** @internal */
    _sameSequenceGroup(sequences: SequenceVar[]): void;
    /**
    * Creates cumulative function (expression) _pulse_ for the given interval variable and height.
    *
    * @remarks
    *
    * Pulse can be used to model resource requirement during an interval variable. The given amount `height` of the resource is used during the whole interval (from start to end).
    *
    * #### Formal definition
    *
    * Pulse creates a cumulative function which has the value:
    *
    * * `0` before `interval.start()`,
    * * `height` between `interval.start()` and `interval.end()`,
    * * `0` after `interval.end()`
    *
    * If `interval` is absent, then the pulse is `0` everywhere.
    *
    * Cumulative functions can be combined using {@link Model.cumulPlus}, {@link Model.cumulMinus}, {@link Model.cumulNeg} and {@link Model.cumulSum}. The minimum and the maximum height of a cumulative function can be constrained using {@link Model.cumulLe} and {@link Model.cumulGe}.
    *
    * :::info
    * Pulses with variable heights (i.e. with `height` given as `IntExpr`) are not supported yet.
    * :::
    *
    * @example
    *
    * Let's consider a set of tasks and a group of 3 workers. Each task requires a certain number of workers (`nbWorkersNeeded`). Our goal is to schedule the tasks so that the length of the schedule (makespan) is minimal.
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
    * @see {@link IntervalVar.pulse | IntervalVar.pulse} is equivalent function on {@link IntervalVar}.
    * @see {@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt} for other basic cumulative functions.
    * @see {@link Model.cumulLe} and {@link Model.cumulGe} for constraints on cumulative functions.
    *  */
    pulse(interval: IntervalVar, height: IntExpr | number): CumulExpr;
    /**
    * Creates cumulative function (expression) that changes value at start of the interval variable by the given height.
    *
    * @remarks
    *
    * Cumulative _step_ functions could be used to model a resource that is consumed or produced and so its amount is changing over time. Example of such a resource is a battery, an account balance, a stock of a product, etc.
    *
    * A `stepAtStart` can be used to change the amount of such resource at the start of a given variable. The amount is changed by the given `height`.
    *
    * Cumulative steps could be combined using {@link Model.cumulPlus}, {@link Model.cumulMinus}, {@link Model.cumulNeg} and {@link Model.cumulSum}. The minimum and the maximum height of a cumulative function can be constrained using {@link Model.cumulLe} and {@link Model.cumulGe}.
    *
    * #### Formal definition
    *
    * stepAtStart creates a cumulative function which has the value:
    *
    * * `0` before `interval.start()`,
    * * `height` after `interval.start()`.
    *
    * If `interval` is _absent_ then the created cumulative function is `0` everywhere.
    *
    * :::info
    * Combining _pulses_ ({@link Model.pulse}) and _steps_ ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}) is not supported yet.
    * :::
    *
    * @example
    *
    * Let's consider a set of tasks. Each task either costs a certain amount of money or makes some money. Money is consumed at the start of a task and produced at the end. We have an initial amount of money `initialMoney`, and we want to schedule the tasks so that we do not run out of money (i.e., the amount is always non-negative).
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
    stepAtStart(interval: IntervalVar, height: IntExpr | number): CumulExpr;
    /**
    * Creates cumulative function (expression) that changes value at end of the interval variable by the given height.
    *
    * @remarks
    *
    * Cumulative _step_ functions could be used to model a resource that is consumed or produced and so its amount is changing over time. Example of such a resource is a battery, an account balance, a stock of a product, etc.
    *
    * A `stepAtEnd` can be used to change the amount of such resource at the end of a given variable. The amount is changed by the given `height`.
    *
    * Cumulative steps could be combined using {@link Model.cumulPlus}, {@link Model.cumulMinus}, {@link Model.cumulNeg} and {@link Model.cumulSum}. The minimum and the maximum height of a cumulative function can be constrained using {@link Model.cumulLe} and {@link Model.cumulGe}.
    *
    * #### Formal definition
    *
    * stepAtEnd creates a cumulative function which has the value:
    *
    * * `0` before `interval.end()`,
    * * `height` after `interval.end()`.
    *
    * If `interval` is _absent_ then the created cumulative function is `0` everywhere.
    *
    * :::info
    * Combining _pulses_ ({@link Model.pulse}) and _steps_ ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}) is not supported yet.
    * :::
    *
    * @example
    *
    * Let's consider a set of tasks. Each task either costs a certain amount of money or makes some money. Money is consumed at the start of a task and produced at the end. We have an initial amount of money `initialMoney`, and we want to schedule the tasks so that we do not run out of money (i.e., the amount is always non-negative).
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
    stepAtEnd(interval: IntervalVar, height: IntExpr | number): CumulExpr;
    /**
    * Creates cumulative function (expression) that changes value at `x` by the given `height`.
    *
    * @remarks
    *
    * Function stepAt is functionally the same as {@link Model.stepAtStart} and {@link Model.stepAtEnd}, but the time of the change is given by parameter `x` instead of by the start/end of an interval variable.
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
    stepAt(x: number, height: IntExpr | number): CumulExpr;
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
    cumulPlus(lhs: CumulExpr, rhs: CumulExpr): CumulExpr;
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
    cumulMinus(lhs: CumulExpr, rhs: CumulExpr): CumulExpr;
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
    cumulNeg(arg: CumulExpr): CumulExpr;
    /**
    * Sum of cumulative expressions.
    *
    * @remarks
    *
    * Computes the sum of cumulative functions. The sum can be used, e.g., to combine contributions of individual tasks to total resource consumption.
    *
    * @see {@link cumulPlus}, {@link cumulMinus}, {@link cumulNeg} for other ways to combine cumulative functions.
    *  */
    cumulSum(array: CumulExpr[]): CumulExpr;
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
    cumulLe(cumul: CumulExpr, maxCapacity: number): void;
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
    cumulGe(cumul: CumulExpr, minCapacity: number): void;
    /** @internal */
    _cumulMaxProfile(cumul: CumulExpr, profile: IntStepFunction): void;
    /** @internal */
    _cumulMinProfile(cumul: CumulExpr, profile: IntStepFunction): void;
    /** @internal */
    _cumulStairs(atoms: CumulExpr[]): CumulExpr;
    /** @internal */
    _precedenceEnergyBefore(main: IntervalVar, others: IntervalVar[], heights: number[], capacity: number): void;
    /** @internal */
    _precedenceEnergyAfter(main: IntervalVar, others: IntervalVar[], heights: number[], capacity: number): void;
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
    stepFunctionSum(func: IntStepFunction, interval: IntervalVar): IntExpr;
    /** @internal */
    _stepFunctionSumInRange(func: IntStepFunction, interval: IntervalVar, lb: number, ub: number): void;
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
    stepFunctionEval(func: IntStepFunction, arg: IntExpr | number): IntExpr;
    /** @internal */
    _stepFunctionEvalInRange(func: IntStepFunction, arg: IntExpr | number, lb: number, ub: number): void;
    /** @internal */
    _stepFunctionEvalNotInRange(func: IntStepFunction, arg: IntExpr | number, lb: number, ub: number): void;
    /**
    * Forbid the interval variable to overlap with segments of the function where the value is zero.
    *
    * @remarks
    *
    * This function prevents the specified interval variable from overlapping with segments of the step function where the value is zero. That is, if $[s, e)$ is a segment of the step function where the value is zero, then the interval variable either ends before $s$ ($\mathtt{interval.end()} \le s$) or starts after $e$ ($e \le \mathtt{interval.start()}$.
    *
    * @see {@link IntervalVar.forbidExtent} for the equivalent function on {@link IntervalVar}.
    * @see {@link Model.forbidStart}, {@link Model.forbidEnd} for similar functions that constrain the start/end of an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidExtent(interval: IntervalVar, func: IntStepFunction): void;
    /**
    * Constrains the start of the interval variable to be outside of the zero-height segments of the step function.
    *
    * @remarks
    *
    * This function is equivalent to:
    *
    * ```
    *   model.constraint(model.ne(model.intStepFunctionEval(func, interval.start()), 0));
    * ```
    *
    * I.e., the function value at the start of the interval variable cannot be zero.
    *
    * @see {@link IntervalVar.forbidStart} for the equivalent function on {@link IntervalVar}.
    * @see {@link Model.forbidEnd} for similar function that constrains end an interval variable.
    * @see {@link Model.stepFunctionEval} for evaluation of a step function.
    *  */
    forbidStart(interval: IntervalVar, func: IntStepFunction): void;
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
    forbidEnd(interval: IntervalVar, func: IntStepFunction): void;
    /** @internal */
    _disjunctiveIsBefore(x: IntervalVar, y: IntervalVar): BoolExpr;
    /** @internal */
    _itvPresenceChain(intervals: IntervalVar[]): void;
    /** @internal */
    _itvPresenceChainWithCount(intervals: IntervalVar[], count: IntExpr | number): void;
    /** @internal */
    _endBeforeStartChain(intervals: IntervalVar[]): void;
    /** @internal */
    _startBeforeStartChain(intervals: IntervalVar[]): void;
    /** @internal */
    _decisionPresentIntVar(variable: IntExpr | number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionAbsentIntVar(variable: IntExpr | number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentIntervalVar(variable: IntervalVar, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionAbsentIntervalVar(variable: IntervalVar, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentLE(variable: IntExpr | number, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalGT(variable: IntExpr | number, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentGE(variable: IntExpr | number, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalLT(variable: IntExpr | number, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentStartLE(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalStartGT(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentStartGE(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalStartLT(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentEndLE(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalEndGT(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionPresentEndGE(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalEndLT(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _noGood(decisions: SearchDecision[]): void;
    /**
     * Constrain a set of interval variables not to overlap.
     *
     * @param intervals An array of interval variables to constrain.
     * @param transitions A 2D square array of minimum transition times between the intervals.
     *                    The size of the array must be equal to the number of interval variables.
     *
     * @remarks
     *
     * This function constrains a set of interval variables so they do not overlap.
     * That is, for each pair of interval variables `x` and `y`, one of the
     * following must hold:
     *
     * 1. Interval variable `x` or `y` is _absent_. In this case, the absent interval
     *    is not scheduled (the task is not performed), so it cannot overlap
     *    with any other interval. Only _optional_ interval variables can be _absent_.
     * 2. Interval variable `x` is before `y`, that is, `x.end()` is less than or
     *    equal to `y.start()`.
     * 3. The interval variable `y` is before `x`. That is, `y.end()` is less than or
     *    equal to `x.start()`.
     *
     * The function can also take a square array `transitions` of minimum
     * transition times between the intervals. The transition time is the time
     * that must elapse between the end of the first interval and the start of the
     * second interval. The transition time cannot be negative. When transition
     * times are specified, the above conditions 2 and 3 are modified as follows:
     *
     * 2. `x.end() + transition[i][j]` is less than or equal to `y.start()`.
     * 3. `y.end() + transition[j][i]` is less than or equal to `x.start()`.
     *
     * Where `i` and `j` are indices of `x` and `y` in the array of interval
     * variables.
     *
     * Note that minimum transition times are enforced between all pairs of
     * intervals, not only between direct neighbors.
     *
     * Functionally, this constraint is the same as
     * {@link SequenceVar.noOverlap | SequenceVar.noOverlap}
     * and {@link Model.noOverlap | Model.noOverlap(SequenceVar, ...)}.
     * The difference is that this function takes an array of interval variables
     * as an argument instead of a sequence variable.
     *
     * @example
     *
     * The following example does not use transition times. For example with
     * transition times see {@link SequenceVar.noOverlap | SequenceVar.noOverlap}.
     *
     * Let's consider a set of tasks that must be performed by a single machine.
     * The machine can handle only one task at a time. Each task is
     * characterized by its length and a deadline. The goal is to schedule the
     * tasks on the machine so that the number of missed deadlines is minimized.
     *
     * ```ts
     * let tasks = [
     *   { length: 10, deadline: 70 },
     *   { length: 20, deadline: 50 },
     *   { length: 15, deadline: 50},
     *   { length: 30, deadline: 100 },
     *   { length: 20, deadline: 120 },
     *   { length: 25, deadline: 90 },
     *   { length: 30, deadline: 80 },
     *   { length: 10, deadline: 40 },
     *   { length: 20, deadline: 60 },
     *   { length: 25, deadline: 150 },
     * ];
  
     * let model = new CP.Model;
  
     * // An interval variable for each task. Begin with an empty array:
     * let taskVars: CP.IntervalVar[] = [];
     * // A boolean expression that is true if the task is late:
     * let isLate: CP.BoolExpr[] = [];
  
     * // Fill the arrays:
     * for (let i = 0; i < tasks.length; i++) {
     *   let task = tasks[i];
     *   let taskVar = model.intervalVar({ name: "Task" + i, length: task.length});
     *   taskVars.push(taskVar);
     *   isLate.push(model.ge(taskVar.end(), task.deadline));
     * }
  
     * // Tasks cannot overlap:
     * model.noOverlap(taskVars);
     * // Minimize the number of late tasks:
     * model.sum(isLate).minimize();
  
     * await CP.solve(model, { searchType: "FDS" });
     * ```
     */
    noOverlap(intervals: Array<IntervalVar>, transitions?: number[][]): void;
    /**
     * Constrain a set of interval variables (forming a sequence variable) not to overlap.
     *
     * @param sequence A sequence variable to constrain. The sequence is formed by
     *                 a set of interval variables.
     * @param transitions A 2D array of minimum transition times between the intervals.
     *
     * @remarks
     *
     * This function is the same as {@link SequenceVar.noOverlap}, only sequence variable
     * is passed as an argument instead. See the documentation for {@link SequenceVar.noOverlap} for details.
     *
     * There is also {@link Model.noOverlap | Model.noOverlap(IntervalVar[], ...)}
     * that takes an array of interval variables instead of a sequence variable.
     */
    noOverlap(sequence: SequenceVar, transitions?: number[][]): void;
    /**
     * Assign a name to the model. It overwrites any name that was previously
     * set, e.g. in the {@link Model} constructor.
     *
     * Naming the model is optional.  The primary purpose of the name is to
     * distinguish between different models during benchmarking (see {@link benchmark}).
     */
    setName(name: string): void;
    /**
     * Returns the name of the model. When no name was set, it returns `undefined`.
     */
    getName(): string | undefined;
    /**
     * Creates a constraint from a boolean expression that must be satisfied in the solution.
     *
     * A constraint is satisfied if it is not _false_. In other words, a constraint is satisfied
     * if it is _true_ or _absent_.
     *
     * @param constraint - The boolean expression to turn into a constraint.
     * @returns A constraint that must be satisfied in the solution.
     *
     * @remarks
     * A boolean expression that is _not_ turned into a constraint can have
     * arbitrary value in the solution.
     *
     * @example
     *
     * In the following example, we create a boolean expression `endsBefore50`
     * that checks whether the end of interval variable `x` is before 50.
     * We don't turn it into a constraint yet:
     *
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ name: "x", length: 10, optional: true });
     * let endsBefore50 = x.end().le(50);
     * ```
     *
     * Because `endsBefore50` is not a constraint, it can take arbitrary
     * value in a solution, in particular:
     *
     * 1. `endsBefore50` is _true_ if `x` is present and its end is less than or equal to 50.
     * 2. `endsBefore50` is _false_ if `x` is present and its end is greater than 50.
     * 3. `endsBefore50` is _absent_ if `x` is absent.
     *
     * Now we turn `endsBefore50` into a constraint:
     *
     * ```ts
     * model.constraint(endsBefore50);
     * ```
     *
     * When `endsBefore50` is a constraint, it can only be _true_ or _absent_ in
     * the solution.  Therefore, cases 1 and 3 above can happen, but case 2 cannot.
     *
     * #### Difference between constraints and boolean expressions
     *
     * Boolean expressions can take arbitrary value (_true_, _false_, or _absent_)
     * and can be combined into composed expressions (e.g., using {@link and} or
     * {@link or}).
     *
     * Constraints can only be _true_ or _absent_ (in a solution) and cannot
     * be combined into composed expressions.
     *
     * Some functions create constraints directly, e.g. {@link noOverlap}.
     * Then, passing them to function {@link constraint} is unnecessary.
     * It is also not possible to combine constraints into composed expressions
     * such as `or(noOverlap(..), noOverlap(..))`.
     */
    constraint(constraint: BoolExpr | boolean): void;
    /** @internal */
    constraint(constraint: Constraint): void;
    /** @internal */
    boolConst(value: boolean): BoolExpr;
    /** @internal */
    trueConst(): BoolExpr;
    /** @internal */
    falseConst(): BoolExpr;
    /** @internal */
    absentConst(): BoolExpr;
    /** @internal */
    intConst(value: number): IntExpr;
    /** @internal */
    floatConst(value: number): FloatExpr;
    /** @internal */
    boolVar({ range, optional, name }: {
        range?: [boolean?, boolean?] | boolean;
        optional?: boolean;
        name?: string;
    }): BoolVar;
    /** @internal */
    boolVar(name?: string): BoolVar;
    /** @internal */
    auxiliaryBoolVar({ range, optional, name }: {
        range?: [boolean?, boolean?] | boolean;
        optional?: boolean;
        name?: string;
    }): BoolVar;
    /**@internal */
    auxiliaryBoolVar(name?: string): BoolVar;
    /** @internal */
    intVar({ range, optional, name }: {
        range?: [number?, number?] | number;
        optional?: boolean;
        name?: string;
    }): IntVar;
    /** @internal */
    intVar(name?: string): IntVar;
    /** @internal */
    auxiliaryIntVar({ range, optional, name }: {
        range?: [number?, number?] | number;
        optional?: boolean;
        name?: string;
    }): IntVar;
    /** @internal */
    auxiliaryIntVar(name?: string): IntVar;
    /** @internal */
    floatVar({ range, optional, name }: {
        range?: [number?, number?] | number;
        optional?: boolean;
        name?: string;
    }): FloatVar;
    /** @internal */
    floatVar(name?: string): FloatVar;
    /** @internal */
    auxiliaryFloatVar({ range, optional, name }: {
        range?: [number?, number?] | number;
        optional?: boolean;
        name?: string;
    }): FloatVar;
    /** @internal */
    auxiliaryFloatVar(name?: string): FloatVar;
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
     * const x = model.intervalVar({ start: 0, length: [10, 20], name: "x" });
     *
     * // Create an interval variable with a start and end ranges:
     * const y = model.intervalVar({ start: [0, 5], end: [10, 15], name: "y" });
     *
     * // Create an optional interval variable with a length interval 5..10:
     * const z = model.intervalVar({ length: [5, 10], optional: true, name: "z" });
     * ```
     *
     * @see {@link IntervalVar}
     */
    intervalVar(params: {
        start?: number | [number?, number?];
        end?: number | [number?, number?];
        length?: number | [number?, number?];
        optional?: boolean;
        name?: string;
    }): IntervalVar;
    /**
     * Creates a new present interval variable with the given name and adds it to the model.
     *
     * @param name - The name of the interval variable.
     * @returns The created interval variable.
     *
     * @remarks
     * The default range for start, end and length is `0` to `IntervalMax`.
     *
     * @example
     *
     * ```ts
     * const model = new CP.Model();
     *
     * // Create an interval variable with a name:
     * const x = model.intervalVar("x");
     *
     * // Create unnamed interval variable (the name will be undefined):
     * const interval2 = model.intervalVar();
     * ```
     * @see {@link IntervalVar}
     * @see {@link IntervalVar.makeOptional}, {@link IntervalVar.makePresent} and {@link IntervalVar.makeAbsent} for changing the presence of the interval.
     * @see {@link IntervalVar.setStart}, {@link IntervalVar.setStartMin} and {@link IntervalVar.setStartMax} for changing the start of the interval.
     * @see {@link IntervalVar.setEnd}, {@link IntervalVar.setEndMin} and {@link IntervalVar.setEndMax} for changing the end of the interval.
     * @see {@link IntervalVar.setLength}, {@link IntervalVar.setLengthMin} and {@link IntervalVar.setLengthMax} for changing the length of the interval.
     */
    intervalVar(name?: string): IntervalVar;
    /** @internal */
    auxiliaryIntervalVar(params: {
        start?: number | [number?, number?];
        end?: number | [number?, number?];
        length?: number | [number?, number?];
        optional?: boolean;
        name?: string;
    }): IntervalVar;
    /** @internal */
    auxiliaryIntervalVar(name?: string): IntervalVar;
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
    sequenceVar(intervals: IntervalVar[], types?: number[]): SequenceVar;
    /** @internal */
    auxiliarySequenceVar(intervals: IntervalVar[], types?: number[]): SequenceVar;
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
    presenceOf(arg: IntExpr | number | boolean | IntervalVar): BoolExpr;
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
    minimize(expr: IntExpr | number): void;
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
    maximize(expr: IntExpr | number): void;
    /** @internal */
    _minimizeConsecutively(arg: IntExpr[]): void;
    /** @internal */
    _maximizeConsecutively(arg: IntExpr[]): void;
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
    stepFunction(values: number[][]): IntStepFunction;
    /** @internal */
    getPrimaryObjectiveExpression(): IntExpr | number | undefined;
    /** @internal */
    _toObject(params?: Parameters, warmStart?: Solution): {
        refs: NodeProps[];
        model: Argument[];
        name: string | undefined;
        objective: NodeProps | undefined;
        parameters: any;
        warmStart: SerializedSolution | undefined;
    };
    /** @internal */
    _serialize(command: string, params: Parameters, warmStart?: Solution): string;
    /** @internal */
    _fromObject(data: any): void;
    /** @internal */
    _getIntArray(arg: number[]): Argument;
    /** @internal */
    _getFloatArray(arg: Array<unknown>): Argument;
    /** @internal */
    _getFloatExprArray(arg: unknown): Argument;
    /** @internal */
    _getIntExprArray(arg: Array<unknown>): Argument;
    /** @internal */
    _getBoolExprArray(arg: Array<unknown>): Argument;
    /** @internal */
    _getIntervalVarArray(arg: IntervalVar[]): Argument;
    /** @internal */
    _getCumulExprArray(arg: CumulExpr[]): Argument;
    /** @internal */
    _getSearchDecisionArray(arg: SearchDecision[]): Argument;
    /** @internal */
    _getSequenceVarArray(arg: SequenceVar[]): Argument;
    /** @internal */
    _getIntMatrix(arg: number[][]): Argument;
    /** @internal */
    _getNewRefId(node: NodeProps): number;
    /**
     * Returns an array of all interval variables in the model.
     */
    getIntervalVars(): Array<IntervalVar>;
    /** @internal */
    getBoolVars(): Array<BoolVar>;
    /** @internal */
    getIntVars(): Array<IntVar>;
}
/**
 * @internal
 * A command for the solver. Used by Solver.setCommand.
 */
export type SolverCommand = "solve" | "propagate" | "toText" | "toJS";
/**
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
 * @category Solving
 * @noInheritDoc
 */
export declare class Solver extends EventEmitter {
    #private;
    /**
     * With `event="error"`, register the given listener function to error events. The
     * function should take an `Error` parameter (standard Node.js class) and
     * return `void`.
     *
     * @param listener The function to be registered.
     * @returns The Solver itself for chaining.
     *
     * @remarks
     *
     * This function is equivalent to the function `EventEmitter.on`. As
     * usual with `EventEmitter`, if there is no listener registered for the
     * 'error' event and an 'error' event is emitted, then the error is thrown.
     *
     * @example
     *
     * In the following example, we simply log all errors on the console.
     *
     * ```ts
     * let solver = new CP.Solver;
     * solver.on('error', (err: Error) => {
     *   console.error('There was an error: ', err);
     * });
     * let result = await solver.solve(myModel, { timeLimit: 60 });
     * ```
     *
     * {@label ON_ERROR}
     */
    on(event: 'error', listener: (err: Error) => void): this;
    /**
     * With `event="warning"`, register a listener function for warning events.
     *
     * @param listener - The listener function to register. It should take a `string`
     *                  parameter (the warning) and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `warning`.  The registered listener function is called for every warning
     * issued by the solver. The warning message is passed as a parameter to the
     * function.
     *
     * Alternatively, you can use function {@link redirectOutput} to redirect
     * all solver output (including the warnings) to a stream.
     *
     * The amount of warning messages can be configured using the parameter
     * {@link Parameters.warningLevel}.
     *
     * @example
     *
     * In the following example, we simply log all warnings on the console
     * using `console.warn`.
     *
     * ```ts
     * const solver = new CP.Solver;
     * solver.on('warning', (msg: string) => {
     *   console.warn(`Warning: ${msg}`);
     * });
     * let result = wait solver.solve(myModel, { searchType: "LNS"});
     * ```
     *
     * {@label ON_WARNING}
     */
    on(event: 'warning', listener: (msg: string) => void): this;
    /**
     * With `event="log"`, add a listener function for log events.
     *
     * @param listener The listener function to add. It should take a `string`
     *                 parameter (the log message) and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `log`.  The registered listener function is called for every log message
     * issued by the solver. The log message is passed as a parameter to the
     * function.
     *
     * The amount of log messages and their periodicity can be controlled
     * by parameters {@link Parameters.logLevel} and {@link Parameters.logPeriod}.
     *
     * Alternatively, you can use function {@link redirectOutput} to redirect
     * all solver output (including the logs) to a stream.
     *
     * @example
     *
     * In the following example, we simply log all logs on the console
     * using `console.log`.
     *
     * ```ts
     * const solver = new CP.Solver;
     * solver.on('log', (msg: string) => {
     *  console.log(`Log: ${msg}`);
     * });
     * let result = await solver.solve(myModel, { logPeriod: 1 });
     * ```
     *
     * {@label ON_LOG}
     */
    on(event: 'log', listener: (msg: string) => void): this;
    /**
     * With `event="trace"`, add a listener function for trace events.
     *
     * @param listener The listener function to add. It should take a `string`
     *                parameter (the trace message) and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `trace`.  The registered listener function is called for every trace
     * message the solver sends. The trace message is passed as a parameter
     * to the function.
     *
     * The types of trace messages can be controlled by parameters such as
     * {@link Parameters.searchTraceLevel} or {@link Parameters.propagationTraceLevel}.
     * Note that traces are available only in the Development version of the
     * solver.
     *
     * Alternatively, you can use function {@link redirectOutput} to redirect
     * all solver output (including the traces) to a stream.
     *
     * @example
     *
     * In the following example, we simply log all traces on the console
     * using `console.log`.
     *
     * ```ts
     * const solver = new CP.Solver;
     * solver.on('trace', (msg: string) => {
     *   console.log(`Trace: ${msg}`);
     * });
     * let result = await solver.solve(myModel, { nbWorkers: 2 });
     * ```
     *
     * {@label ON_TRACE}
     */
    on(event: 'trace', listener: (msg: string) => void): this;
    /**
     * With `event="solution"`, add a listener function for solution events.
     *
     * @param listener The listener function to add. It should take a
     *                {@link SolutionEvent} parameter and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `solution`.  The registered listener function is called for every solution
     * the solver finds. The solution is passed to the function via {@link SolutionEvent} parameter.
     *
     * @example
     *
     * In the following example, we log the value of the interval variable `x` in every
     * solution using `console.log`.
     *
     * ```ts
     * let model = new CP.Model();
     * let x = model.intervalVar({ length: 5 });
     * ...
     * const solver = new CP.Solver;
     * solver.on('solution', (msg: SolutionEvent) => {
     *   let solution = msg.solution;
     *   let start = solution.getStart(x);
     *   let end = solution.getEnd(x);
     *   if (start === undefined)
     *     console.log("Solution found with x=absent");
     *   else
     *     console.log("Solution found with x=[" + start + "," + end + "]");
     * });
     * let result = await solver.solve(myModel);
     * ```
     *
     * Note that in the Evaluation version of the solver, the reported value of
     * interval variable `x` will be always _absent_ because the real variable
     * values are masked.
     *
     * {@label ON_SOLUTION}
     */
    on(event: 'solution', listener: (msg: SolutionEvent) => void): this;
    /**
     * With `event="lowerBound"`, add a listener function for lower bound events.
     *
     * @param listener The listener function to add. It should take a
     *               {@link LowerBoundEvent} parameter and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `lowerBound`.  The registered listener function is called for every
     * lower bound update issued by the solver. The lower bound is passed via
     * {@link LowerBoundEvent} parameter to the function.
     *
     * {@label ON_LOWER_BOUND}
     */
    on(event: 'lowerBound', listener: (msg: LowerBoundEvent) => void): this;
    /**
     * With `event="summary"`, add a listener function for summary events.
     *
     * @param listener The listener function to add. It should take a
     *               {@link SolveSummary} parameter and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `summary`.  The registered listener function is called at the end of
     * the search, and the summary is passed via {@link SolveSummary} parameter
     * to the function.  The summary contains information about the search
     * such as the number of solutions found, the number of failures, the
     * search time, etc.
     *
     * @example
     *
     * In the following example, we log part of the summary message on the
     * console using `console.log`.
     *
     * ```ts
     * const solver = new CP.Solver;
     * solver.on('summary', (msg: SolveSummary) => {
     *   console.log(`Solutions: ${msg.nbSolution}`);
     *   console.log(`Branches: ${msg.nbBranches}`);
     *   console.log(`Duration: ${msg.duration}`);
     * });
     * let result = await solver.solve(myModel);
     * ```
     *
     * {@label ON_SUMMARY}
     */
    on(event: 'summary', listener: (msg: SolveSummary) => void): this;
    /**
     * With `event="close"`, add a listener function for close events.
     *
     * @param listener The listener function to add. It should take no
     *               parameter and return `void`.
     *
     * @remarks
     *
     * This function is equivalent to function `EventEmitter.on` for event type
     * `close`.  The registered listener function is called when the solver
     * is closed. The function takes no parameter.
     *
     * The event `close` is always the last event emitted by the Solver, even in
     * the case of an error. It could be used, for example, to wait for solver
     * completion.
     *
     * See {@link Solver} for an example of use.
     *
     * {@label ON_CLOSE}
     */
    on(event: 'close', listener: () => void): this;
    /**
     * @internal
     * Used for {@link propagate}, which is async anyway.
     * So no need for the user to use Solver for this purpose.
     */
    on(event: 'domains', listener: (msg: DomainsEvent) => void): this;
    /**
     * @internal
     */
    on(event: 'textModel', listener: (msg: string) => void): this;
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
     */
    solve(model: Model, params?: Parameters, warmStart?: Solution, log?: NodeJS.WritableStream | null): Promise<SolveResult>;
    /** @internal */
    _run(command: SolverCommand, model: Model, params?: Parameters, warmStart?: Solution, log?: NodeJS.WritableStream | null): Promise<void>;
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
    stop(reason: string): Promise<void>;
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
    sendSolution(solution: Solution): Promise<void>;
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
    redirectOutput(stream: NodeJS.WritableStream | null): Solver;
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
    _hasFinished(): boolean;
}
/**
 * An item in {@link SolveResult.objectiveHistory | SolveResult.objectiveHistory} array.
 * There is one item for each solution found.
 *
 * @category Solving
 */
export type ObjectiveHistoryItem = {
    /** Duration of the solve at the time the solution was found, in seconds. */
    solveTime: number;
    /** Objective value of the solution. */
    objective: ObjectiveValue;
    /**
     * Result of the verification of the solution.
     *
     * When parameter {@link Parameters.verifySolutions} is set to true (the
     * default), then the solver verifies all solutions found. The
     * verification checks that all constraints in the model are satisfied and
     * that the objective value is computed correctly.
     *
     * The verification is done using a separate code (not used during the
     * search).  The point is to independently verify the correctness of the
     * solution.
     *
     * Possible values are:
     *
     *  * `undefined` - the solution was not verified (because the parameter
     *    {@link Parameters.verifySolutions} was not set).
     * * `true` - the solution was verified and correct.
     *
     * The value can never be `false` because, in this case, the solver would
     * stop with an error.
     */
    valid?: undefined | true;
};
/**
 * The result of function {@link solve}. It contains all information from {@link
 * SolveSummary} such as the best solution found and some statistics about the
 * search. In addition, it contains the best solution found, the history of the
 * objective values, etc.
 *
 * @category Solving
 */
export type SolveResult = SolveSummary & {
    /** The history of objective values. Each item of the array contains an
     * objective value of a solution found and the time when it was found. */
    objectiveHistory: Array<ObjectiveHistoryItem>;
    /** Best (i.e. the last) solution found. When no solution was found then `undefined`. */
    bestSolution?: Solution;
    /** The time when the best solution was found. It could be `undefined`. */
    bestSolutionTime?: number;
    /** The time of the last (i.e., the best) lower bound change. */
    bestLBTime?: number;
    /** Whether `bestSolution` was verified. The value could be only `true` or
     * `undefined` depending on parameter {@link Parameters.verifySolutions}. */
    bestSolutionValid?: true | undefined;
    /** A history of lower bound. Every item of the array contains a lower-bound
     * and a time when it was proved. */
    lowerBoundHistory: Array<LowerBoundEvent>;
};
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
 * @category Solving
 */
export declare function solve(model: Model, params?: Parameters, warmStart?: Solution, log?: NodeJS.WritableStream | null): Promise<SolveResult>;
/**
 * The definition of a problem to solve, i.e., all the input the solver needs for solving.
 *
 * @remarks
 *
 * This type contains everything that is needed to solve a model. In particular
 * it contains the model itself, the parameters to use for solving (optional)
 * and the starting solution (optional).
 *
 * @category Model exporting
 */
export type ProblemDefinition = {
    /** The model to solve. */
    model: Model;
    /** The parameters to use for solving. */
    parameters?: Parameters;
    /** The solution to start with. */
    warmStart?: Solution;
};
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
 * @category Model exporting
 */
export declare function problem2json(problem: ProblemDefinition): string;
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
 * @category Model exporting
 */
export declare function json2problem(json: string): ProblemDefinition;
/** @internal */
export declare function _toText(model: Model, cmd: SolverCommand, params?: Parameters, warmStart?: Solution, log?: NodeJS.WritableStream | null): Promise<string>;
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
 * @category Model exporting
 */
export declare function problem2txt(model: Model, params?: Parameters, warmStart?: Solution, log?: NodeJS.WritableStream | null): Promise<string | undefined>;
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
 * @category Model exporting
 * @experimental
 */
export declare function problem2js(model: Model, params?: Parameters, warmStart?: Solution, log?: NodeJS.WritableStream | null): Promise<string | undefined>;
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
 * @category Propagation
 */
export declare function propagate(model: Model, parameters?: Parameters, log?: NodeJS.WritableStream | null): Promise<PropagationResult>;
/**
 * Extension of {@link Parameters} that can be used to parameterize function {@link benchmark}.
 *
 * The parameters are the same as in {@link Parameters} with some additions that
 * control the behavior of function {@link benchmark}. In particular, there are
 * parameters that allow storing the output in file(s), running the model multiple
 * times with multiple seeds, etc.
 *
 * Parameters can also be parsed from command line arguments using function
 * {@link parseBenchmarkParameters} or {@link parseSomeBenchmarkParameters}.
 *
 * ### Filename patterns
 *
 * Some parameters can specify a filename pattern. Patterns allow
 * the generation of a unique file name for each benchmark run.
 * The pattern is a string that can contain the following placeholders:
 *
 * * `{name}` - the name of the model (see {@link Model.setName | Model.setName}). If the model
 *              name is not set (it is `undefined`), then a unique name is generated.
 * * `{seed}` - the seed used for the run. Useful, especially in combination with
 *              `nbSeeds` parameter.
 * * `{flat_name}` - the name of the model with all characters `'/'` replaced by `'_'`.
 *
 * @category Benchmarking
 */
export type BenchmarkParameters = Parameters & {
    /** Run each model multiple times with a different random seed. */
    nbSeeds?: number;
    /**
     * Run up to the specified number of solves in parallel.
     *
     * Make sure that you limit the number of workers in all models
     * using parameter {@link Parameters.nbWorkers}.
     */
    nbParallelRuns?: number;
    /** Constrain the objective to be greater or equal to the given value. */
    minObjective?: number;
    /** Constrain the objective to be less or equal to the given value. */
    maxObjective?: number;
    /**
     * Filename for a summary of all benchmarks. The summary is in CSV format,
     * there is a line for each benchmark run. */
    summary?: string;
    /**
     * Filename pattern for log files. Every benchmark run will be logged into a
     * separate file. See patterns in {@link BenchmarkParameters}.
     */
    log?: string;
    /**
     * Filename pattern for results of a benchmark. The result is stored in JSON
     * format as {@link BenchmarkResult}.
     */
    result?: string;
    /**
     * Filename pattern for exporting the problem into JSON format. See patterns in
     * {@link BenchmarkParameters}.  The problems are exported using function {@link problem2json}.
     * The problem is solved before exporting (unless parameter `solve` is set to `false`).
     * If a solution is found, it is included in export as a warm start.
     */
    exportJSON?: string;
    /**
     * Filename pattern for exporting the problem into text format.  See patterns in
     * {@link BenchmarkParameters}.  The models are exported using function {@link problem2txt}.
     * The problem is solved before exporting (unless parameter `solve` is set to `false`).
     * If a solution was found, it is included in the exported text.
     */
    exportTxt?: string;
    /**
     * Filename pattern for exporting the model into JavaScript. See patterns in
     * {@link BenchmarkParameters}.  The models are exported using function {@link problem2js}.
     * The problem is solved before exporting (unless parameter `solve` is set to `false`).
     * If a solution is found, it is included in the exported code as a warm start.
     */
    exportJS?: string;
    /**
     * Filename pattern for exporting domains after propagation. See patterns in
     * {@link BenchmarkParameters}. The file is in text format.
     */
    exportDomains?: string;
    /**
     * Whether to solve the model(s). The value could be `true`, `false` or
     * `undefined`, {@link solve} is not called only if the value is `false`.
     *
     * Not calling solve can be useful in combination with `exportJSON`,
     * `exportTxt`, or `exportJS`.
     */
    solve?: boolean;
    /**
     * Filename for detailed results of all benchmarks. The result is in JSON format,
     * it is an array of {@link BenchmarkResult}.
     */
    output?: string;
    /**
     * When set to `true` then don't include solutions in the file specified by
     * `output` parameter. This can save a lot of space.
     */
    dontOutputSolutions?: boolean;
};
/** @internal
 * Note that the following parameter is not documented. It is functional only for internal builds:
  "  --exportDomains fileNamePattern  Export domains after the propagate into a text file\n" +
 *
*/
export declare const BenchmarkParametersHelp: string;
/**
 * Parse benchmark parameters from command line arguments.
 *
 * @category Benchmarking
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
 * {@link WorkerParameters} can be specified for individual workers using `--workerN.` prefix,
 * and also for worker ranges using `--workerN-M.` prefix.
 * For example:
 *
 * * `--worker0.searchType FDS` sets the search type to the first worker only.
 * * `--worker4-8.noOverlapPropagationLevel 4` sets the propagation level of `noOverlap` constraint for workers 4, 5, 6, 7, and 8.
 *
 * @see {@link parseSomeBenchmarkParameters} for a version that allows unrecognized arguments.
 * @see Functions {@link parseParameters} and {@link parseSomeParameters} for
 *     parsing only solver parameters.
 */
export declare function parseBenchmarkParameters(params?: BenchmarkParameters, args?: string[]): BenchmarkParameters;
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
 * @category Benchmarking
 */
export declare function parseSomeBenchmarkParameters(params: BenchmarkParameters, args?: string[]): Array<string>;
/**
 * Basic data about a benchmark run results produced by function {@link benchmark}.
 * The following properties are always present in {@link BenchmarkResult},
 * regardless of whether the benchmark was successful or ended by an error.
 *
 * @see {@link BenchmarkResult}
 * @see {@link benchmark}
 *
 * @category Benchmarking
 */
export type BaseBenchmarkResult = {
    /** Name of the model that was run.  See {@link Model.setName}. */
    modelName: string;
    /** The date when the model was solved. */
    solveDate: Date;
    /** Parameters used to solve the model. Those parameters are the same as
     * passed to function {@link benchmark}, except for parameter
     * {@link Parameters.randomSeed} that can be changed when
     * {@link BenchmarkParameters.nbSeeds | BenchmarkParameters.nbSeeds} is used.
     */
    parameters: Parameters;
};
/**
 * Data about a benchmark run that ended by an error (see function {@link benchmark}).
 *
 * It is an extension of {@link BaseBenchmarkResult} with additional property `error`
 * that describes the error.
 *
 * @see {@link BenchmarkResult}
 * @see {@link benchmark}
 *
 * @category Benchmarking
 */
export type ErrorBenchmarkResult = BaseBenchmarkResult & {
    /** Error that happened during the solve. */
    error: string;
};
/**
 * Data about normal benchmark run (that didn't end by an error), see
 * function {@link benchmark}.
 *
 * It is an extension of {@link BaseBenchmarkResult}
 * and {@link SolveResult}, i.e. it contains all properties from those two types.
 * it also contains an `error` field that is always `undefined`.
 *
 * @see {@link BenchmarkResult}
 * @see {@link benchmark}
 *
 * @category Benchmarking
 */
export type NormalBenchmarkResult = BaseBenchmarkResult & SolveResult & {
    /** For regular runs, `error` is undefined. This property
     * can be used to distinguish regular runs from error runs.
     */
    error: undefined;
};
/**
 * Data about a benchmark run produced by function {@link benchmark}.
 *
 * When the run ends with an error, then the `error` property is a string describing
 * the error, and the result is of type {@link ErrorBenchmarkResult}.
 * Otherwise, the `error` property is `undefined`, and the result is of type
 * {@link NormalBenchmarkResult}.
 *
 * Regardless of whether the run ended by an error or not, the result contains
 * properties from {@link BaseBenchmarkResult} with basic information about the
 * run (model name, solve date, and parameters used).
 *
 * @see {@link benchmark}
 * @see {@link NormalBenchmarkResult}
 * @see {@link ErrorBenchmarkResult}
 *
 * @category Benchmarking
 */
export type BenchmarkResult = ErrorBenchmarkResult | NormalBenchmarkResult;
/**
 *  A function that generates a problem definition or a model from the given input. The function can be `async`.
 *
 * @category Benchmarking
 */
export type ProblemGenerator = (input: any) => ProblemDefinition | Model | Promise<ProblemDefinition> | Promise<Model>;
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
 * @category Benchmarking
 *
 */
export declare function benchmark(problemGenerator: ProblemGenerator, inputs: Array<any>, params: BenchmarkParameters): Promise<BenchmarkResult[]>;
export {};
