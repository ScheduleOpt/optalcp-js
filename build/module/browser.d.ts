/**
 * The version of the module, such as "1.0.0".
 * @category Constants
 */
export declare const Version = "2026.1.0";
declare const enum PresenceStatus {
    Optional = 0,
    Present = 1,
    Absent = 2
}
type IndirectArgument = {
    arg?: ElementProps;
    ref?: number;
};
type ScalarArgument = number | boolean | IndirectArgument;
type Argument = ScalarArgument | Array<ScalarArgument> | number[][];
interface ElementProps {
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
/** @internal */
type SerializedModelData = {
    refs: Array<ElementProps>;
    model: Array<Argument>;
    name?: string;
    objective?: ElementProps;
};
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
export declare const IntVarMax = 1073741823;
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
export declare const IntVarMin: number;
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
export declare const IntervalMax = 715827882;
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
export declare const IntervalMin = -715827882;
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
export declare const LengthMax: number;
/** @internal */
export declare const FloatVarMax: number;
/** @internal */
export declare const FloatVarMin: number;
/**
 * Summary statistics from the solver at completion.
 *
 * @remarks
 * Contains statistics about the solve including the number of solutions found,
 * the total duration, search statistics (branches, fails, restarts), and
 * information about the model and environment.
 *
 * This class is passed to the `on_summary` callback. For a richer interface
 * with additional tracking data (solution history, objective bounds history),
 * see {@link SolveResult}.
 *
 * @category Solving
 */
export type SolveSummary = {
    /**
     * Number of solutions found during the solve.
     *
     * @returns Solution count.
     */
    nbSolutions: number;
    /**
     * Whether the solve ended with a proof (optimality or infeasibility).
     *
     * @returns True if the solve completed with a proof.
     *
     * @remarks
     * When `True`, the solver has either:
     *
     * - Proved optimality (found a solution within the bounds defined by
     *    {@link Parameters.absoluteGapTolerance} and {@link Parameters.relativeGapTolerance}), or
     * - Proved infeasibility (no solution exists)
     *
     * When `False`, the solve was interrupted (e.g., by time limit) before
     * a proof could be established.
     */
    proof: boolean;
    /**
     * Total duration of the solve in seconds.
     *
     * @returns Seconds elapsed.
     */
    duration: number;
    /**
     * Total number of branches explored during the solve.
     *
     * @returns Branch count.
     */
    nbBranches: number;
    /**
     * Total number of failures encountered during the solve.
     *
     * @returns Failure count.
     */
    nbFails: number;
    /**
     * Total number of Large Neighborhood Search steps.
     *
     * @returns LNS step count.
     */
    nbLNSSteps: number;
    /**
     * Total number of restarts performed during the solve.
     *
     * @returns Restart count.
     */
    nbRestarts: number;
    /**
     * Memory used by the solver in bytes.
     *
     * @returns Bytes used.
     */
    memoryUsed: number;
    /**
     * Best objective value found (for optimization problems).
     *
     * @returns The objective value, or None if not applicable.
     *
     * @remarks
     * The value is `None` when:
     *
     * - No objective was specified in the model (no {@link Model.minimize} or {@link Model.maximize} call).
     * - No solution was found.
     * - The objective expression has an absent value in the best solution.
     */
    objective?: ObjectiveValue;
    /**
     * Proved bound on the objective value.
     *
     * @returns The objective bound, or None if no bound was proved.
     *
     * @remarks
     * For minimization problems, this is a lower bound: the solver proved that
     * no solution exists with an objective value less than this bound.
     *
     * For maximization problems, this is an upper bound: the solver proved that
     * no solution exists with an objective value greater than this bound.
     *
     * The value is `None` when no bound was proved or for satisfaction problems.
     */
    objectiveBound?: ObjectiveValue;
    /**
     * Number of integer variables in the model.
     *
     * @returns Integer variable count.
     */
    nbIntVars: number;
    /**
     * Number of interval variables in the model.
     *
     * @returns Interval variable count.
     */
    nbIntervalVars: number;
    /**
     * Number of constraints in the model.
     *
     * @returns Constraint count.
     */
    nbConstraints: number;
    /**
     * Solver name and version string.
     *
     * @returns The solver identification string.
     *
     * @remarks
     * Contains the solver name followed by its version number.
     */
    solver: string;
    /**
     * Number of worker threads actually used during solving.
     *
     * @returns Worker count.
     *
     * @remarks
     * This is the actual number of workers used by the solver, which may differ
     * from the requested {@link Parameters.nbWorkers} if that parameter was not
     * specified (auto-detect) or if the system has fewer cores than requested.
     */
    actualWorkers: number;
    /**
     * CPU name detected by the solver.
     *
     * @returns CPU model name.
     *
     * @remarks
     * Contains the CPU model name as detected by the operating system.
     */
    cpu: string;
    /**
     * Objective direction.
     *
     * @returns 'minimize', 'maximize', or None for satisfaction problems.
     *
     * @remarks
     * Indicates whether the model was a minimization problem, maximization problem,
     * or a satisfaction problem (no objective).
     */
    objectiveSense: "minimize" | "maximize" | undefined;
    /** @internal @deprecated Use `actualWorkers` instead. */
    nbWorkers: number;
    /** @internal @deprecated Use `objectiveBound` instead. */
    lowerBound?: ObjectiveValue;
};
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
export declare abstract class ModelElement {
    protected _props: ElementProps;
    protected _cp: Model;
    protected _arg: IndirectArgument;
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
    get name(): string | undefined;
    set name(value: string);
    /** @internal @deprecated Use `name` property instead */
    setName(name: string): void;
    /** @internal @deprecated Use `name` property instead */
    getName(): string | undefined;
    /** @internal */
    _getProps(): ElementProps;
    /** @internal */
    _getArg(): IndirectArgument;
    /** @internal */
    _getId(): number;
}
/**
 * @internal
 */
declare class Directive extends ModelElement {
    readonly __brand: 'Directive';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): Directive;
}
/**
 * @internal
 */
export declare class Constraint extends ModelElement {
    readonly __brand: 'Constraint';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): Constraint;
}
/**
 * @remarks
 * A class representing floating-point expression in the model.
 * Currently, there is no way to create floating-point expressions.
 * The class is only a base class for {@link IntExpr}.
 *
 * @category Modeling
 */
export declare class FloatExpr extends ModelElement {
    readonly __floatExprBrand: 'FloatExpr';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): FloatExpr;
    /** @internal */
    _reusableFloatExpr(): FloatExpr;
    /** @internal */
    _floatIdentity(rhs: FloatExpr | number): Constraint;
    /** @internal */
    _floatGuard(absentValue?: number): FloatExpr;
    /** @internal */
    neg(): FloatExpr;
    /** @internal */
    _floatPlus(rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMinus(rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatTimes(rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatDiv(rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatEq(rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatNe(rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLt(rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLe(rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGt(rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGe(rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatInRange(lb: number, ub: number): BoolExpr;
    /** @internal */
    _floatNotInRange(lb: number, ub: number): BoolExpr;
    /** @internal */
    abs(): FloatExpr;
    /** @internal */
    square(): FloatExpr;
    /** @internal */
    _floatMin2(rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMax2(rhs: FloatExpr | number): FloatExpr;
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
export declare class IntExpr extends FloatExpr {
    readonly __intExprBrand: 'IntExpr';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): IntExpr;
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
    minimize(): Objective;
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
    maximize(): Objective;
    /** @internal */
    _reusableIntExpr(): IntExpr;
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
    presence(): BoolExpr;
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
    guard(absentValue?: number): IntExpr;
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
    neg(): IntExpr;
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
    plus(rhs: IntExpr | number): IntExpr;
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
    minus(rhs: IntExpr | number): IntExpr;
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
    times(rhs: IntExpr | number): IntExpr;
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
    div(rhs: IntExpr | number): IntExpr;
    /** @internal */
    _modulo(rhs: IntExpr | number): IntExpr;
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
    identity(rhs: IntExpr | number): Constraint;
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
    eq(rhs: IntExpr | number): BoolExpr;
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
    ne(rhs: IntExpr | number): BoolExpr;
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
    lt(rhs: IntExpr | number): BoolExpr;
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
    le(rhs: IntExpr | number): BoolExpr;
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
    gt(rhs: IntExpr | number): BoolExpr;
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
    ge(rhs: IntExpr | number): BoolExpr;
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
    inRange(lb: number, ub: number): BoolExpr;
    /** @internal */
    _notInRange(lb: number, ub: number): BoolExpr;
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
    abs(): IntExpr;
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
    min2(rhs: IntExpr | number): IntExpr;
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
    max2(rhs: IntExpr | number): IntExpr;
    /** @internal */
    square(): IntExpr;
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
export declare class BoolExpr extends IntExpr {
    readonly __boolExprBrand: 'BoolExpr';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): BoolExpr;
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
    enforce(): void;
    /** @internal */
    _reusableBoolExpr(): BoolExpr;
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
    not(): BoolExpr;
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
    or(rhs: BoolExpr | boolean): BoolExpr;
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
    and(rhs: BoolExpr | boolean): BoolExpr;
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
    implies(rhs: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _eq(rhs: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _ne(rhs: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _nand(rhs: BoolExpr | boolean): BoolExpr;
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
export declare class Objective extends ModelElement {
    readonly __brand: 'Objective';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): Objective;
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
export declare class IntVar extends IntExpr {
    /** @internal */
    static _Create(cp: Model): IntVar;
    /** @internal */
    static _CreateFromJSON(cp: Model, props: ElementProps, id: number): IntVar;
    _getArg(): IndirectArgument;
    /** @internal */
    _makeAuxiliary(): void;
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
    get optional(): boolean | null;
    set optional(value: boolean | null);
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
    get min(): number | null;
    set min(value: number);
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
    get max(): number | null;
    set max(value: number);
    /** @internal @deprecated Use `optional` property instead */
    isOptional(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isPresent(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isAbsent(): boolean;
    /** @internal @deprecated Use `min` property instead */
    getMin(): number | null;
    /** @internal @deprecated Use `max` property instead */
    getMax(): number | null;
    /** @internal @deprecated Use `optional` property instead */
    makeOptional(): void;
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent(): void;
    /** @internal @deprecated Use `optional` property instead */
    makePresent(): void;
    /** @internal @deprecated Use `min` property instead */
    setMin(min: number): void;
    /** @internal @deprecated Use `max` property instead */
    setMax(max: number): void;
    /** @internal @deprecated Use `min` and `max` properties instead */
    setRange(min: number, max: number): void;
}
/** @internal */
export declare class FloatVar extends FloatExpr {
    /** @internal */
    static _Create(cp: Model): FloatVar;
    /** @internal */
    static _CreateFromJSON(cp: Model, props: ElementProps, id: number): FloatVar;
    _getArg(): IndirectArgument;
    /** @internal */
    _makeAuxiliary(): void;
    get optional(): boolean | null;
    set optional(value: boolean | null);
    get min(): number | null;
    set min(value: number);
    get max(): number | null;
    set max(value: number);
    /** @internal @deprecated Use `optional` property instead */
    isOptional(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isPresent(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isAbsent(): boolean;
    /** @internal @deprecated Use `min` property instead */
    getMin(): number | null;
    /** @internal @deprecated Use `max` property instead */
    getMax(): number | null;
    /** @internal @deprecated Use `optional` property instead */
    makeOptional(): void;
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent(): void;
    /** @internal @deprecated Use `optional` property instead */
    makePresent(): void;
    /** @internal @deprecated Use `min` property instead */
    setMin(min: number): void;
    /** @internal @deprecated Use `max` property instead */
    setMax(max: number): void;
    /** @internal @deprecated Use `min` and `max` properties instead */
    setRange(min: number, max: number): void;
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
export declare class BoolVar extends BoolExpr {
    /** @internal */
    static _Create(cp: Model): BoolVar;
    /** @internal */
    static _CreateFromJSON(cp: Model, props: ElementProps, id: number): BoolVar;
    _getArg(): IndirectArgument;
    /** @internal */
    _makeAuxiliary(): void;
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
    get optional(): boolean | null;
    set optional(value: boolean | null);
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
    get min(): boolean | null;
    set min(value: boolean);
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
    get max(): boolean | null;
    set max(value: boolean);
    /** @internal @deprecated Use `optional` property instead */
    isOptional(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isPresent(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isAbsent(): boolean;
    /** @internal @deprecated Use `min` property instead */
    getMin(): boolean | null;
    /** @internal @deprecated Use `max` property instead */
    getMax(): boolean | null;
    /** @internal @deprecated Use `optional` property instead */
    makeOptional(): void;
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent(): void;
    /** @internal @deprecated Use `optional` property instead */
    makePresent(): void;
    /** @internal @deprecated Use `min` property instead */
    setMin(min: boolean): void;
    /** @internal @deprecated Use `max` property instead */
    setMax(max: boolean): void;
    /** @internal @deprecated Use `min` and `max` properties instead */
    setRange(minVal: boolean, maxVal: boolean): void;
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
export declare class IntervalVar extends ModelElement {
    readonly __brand: 'IntervalVar';
    /** @internal */
    static _Create(cp: Model): IntervalVar;
    /** @internal */
    static _CreateFromJSON(cp: Model, props: ElementProps, id: number): IntervalVar;
    _getArg(): IndirectArgument;
    /** @internal */
    _makeAuxiliary(): void;
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
    get optional(): boolean | null;
    set optional(value: boolean | null);
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
    get startMin(): number | null;
    set startMin(value: number);
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
    get startMax(): number | null;
    set startMax(value: number);
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
    get endMin(): number | null;
    set endMin(value: number);
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
    get endMax(): number | null;
    set endMax(value: number);
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
    get lengthMin(): number | null;
    set lengthMin(value: number);
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
    get lengthMax(): number | null;
    set lengthMax(value: number);
    /** @internal @deprecated Use `optional` property instead */
    isOptional(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isPresent(): boolean;
    /** @internal @deprecated Use `optional` property instead */
    isAbsent(): boolean;
    /** @internal @deprecated Use `startMin` property instead */
    getStartMin(): number | null;
    /** @internal @deprecated Use `startMax` property instead */
    getStartMax(): number | null;
    /** @internal @deprecated Use `endMin` property instead */
    getEndMin(): number | null;
    /** @internal @deprecated Use `endMax` property instead */
    getEndMax(): number | null;
    /** @internal @deprecated Use `lengthMin` property instead */
    getLengthMin(): number | null;
    /** @internal @deprecated Use `lengthMax` property instead */
    getLengthMax(): number | null;
    /** @internal @deprecated Use `optional` property instead */
    makeOptional(): void;
    /** @internal @deprecated Use `optional` property instead */
    makePresent(): void;
    /** @internal @deprecated Use `optional` property instead */
    makeAbsent(): void;
    /** @internal @deprecated Use `startMin` and `startMax` properties instead */
    setStart(s: number): void;
    /** @internal @deprecated Use `startMin` and `startMax` properties instead */
    setStart(sMin: number, sMax: number): void;
    /** @internal @deprecated Use `startMin` property instead */
    setStartMin(sMin: number): void;
    /** @internal @deprecated Use `startMax` property instead */
    setStartMax(sMax: number): void;
    /** @internal @deprecated Use `endMin` and `endMax` properties instead */
    setEnd(e: number): void;
    /** @internal @deprecated Use `endMin` and `endMax` properties instead */
    setEnd(eMin: number, eMax: number): void;
    /** @internal @deprecated Use `endMin` property instead */
    setEndMin(eMin: number): void;
    /** @internal @deprecated Use `endMax` property instead */
    setEndMax(eMax: number): void;
    /** @internal @deprecated Use `lengthMin` and `lengthMax` properties instead */
    setLength(len: number): void;
    /** @internal @deprecated Use `lengthMin` and `lengthMax` properties instead */
    setLength(lMin: number, lMax: number): void;
    /** @internal @deprecated Use `lengthMin` property instead */
    setLengthMin(lMin: number): void;
    /** @internal @deprecated Use `lengthMax` property instead */
    setLengthMax(lMax: number): void;
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
    presence(): BoolExpr;
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
    start(): IntExpr;
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
    end(): IntExpr;
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
    length(): IntExpr;
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
    startOr(absentValue: number): IntExpr;
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
    endOr(absentValue: number): IntExpr;
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
    lengthOr(absentValue: number): IntExpr;
    /** @internal */
    _overlapLength(interval2: IntervalVar): IntExpr;
    /** @internal */
    _alternativeCost(options: IntervalVar[], weights: number[]): IntExpr;
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
    endBeforeEnd(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    endBeforeStart(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startBeforeEnd(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startBeforeStart(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    endAtEnd(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    endAtStart(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startAtEnd(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startAtStart(successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    alternative(options: IntervalVar[]): Constraint;
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
    span(covered: IntervalVar[]): Constraint;
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
    position(sequence: SequenceVar): IntExpr;
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
    pulse(height: IntExpr | number): CumulExpr;
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
    stepAtStart(height: IntExpr | number): CumulExpr;
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
    stepAtEnd(height: IntExpr | number): CumulExpr;
    /** @internal */
    _precedenceEnergyBefore(others: IntervalVar[], heights: number[], capacity: number): Constraint;
    /** @internal */
    _precedenceEnergyAfter(others: IntervalVar[], heights: number[], capacity: number): Constraint;
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
    forbidExtent(func: IntStepFunction): Constraint;
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
    forbidStart(func: IntStepFunction): Constraint;
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
    forbidEnd(func: IntStepFunction): Constraint;
    /** @internal */
    _disjunctiveIsBefore(y: IntervalVar): BoolExpr;
    /** @internal */
    _related(y: IntervalVar): Directive;
}
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
export declare class SequenceVar extends ModelElement {
    readonly __brand: 'SequenceVar';
    /** @internal */
    static _Create(cp: Model, func: string, args: Argument[]): SequenceVar;
    _getArg(): IndirectArgument;
    /** @internal */
    _makeAuxiliary(): void;
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
    noOverlap(transitions?: number[][]): Constraint;
    /** @internal */
    _noOverlap(transitions?: number[][]): Constraint;
    /** @internal */
    _sameSequence(sequence2: SequenceVar): Constraint;
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
export declare class CumulExpr extends ModelElement {
    readonly __brand: 'CumulExpr';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): CumulExpr;
    /** @internal @deprecated Use `CumulExpr.plus` instead. */
    cumulPlus(rhs: CumulExpr): CumulExpr;
    /** @internal @deprecated Use `CumulExpr.minus` instead. */
    cumulMinus(rhs: CumulExpr): CumulExpr;
    /** @internal @deprecated Use `CumulExpr.le` instead. */
    cumulLe(maxCapacity: IntExpr | number): Constraint;
    /** @internal @deprecated Use `CumulExpr.ge` instead. */
    cumulGe(minCapacity: number): Constraint;
    /** @internal @deprecated Use `CumulExpr.neg` instead. */
    cumulNeg(): CumulExpr;
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
    plus(rhs: CumulExpr): CumulExpr;
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
    minus(rhs: CumulExpr): CumulExpr;
    /**
     * Negation of a cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * This function is the same as {@link Model.neg}.
     */
    neg(): CumulExpr;
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
    le(maxCapacity: IntExpr | number): Constraint;
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
    ge(minCapacity: number): Constraint;
    /** @internal */
    _cumulMaxProfile(profile: IntStepFunction): Constraint;
    /** @internal */
    _cumulMinProfile(profile: IntStepFunction): Constraint;
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
export declare class IntStepFunction extends ModelElement {
    readonly __brand: 'IntStepFunction';
    /** @internal */
    static _CreateWithValues(cp: Model, values: number[][]): IntStepFunction;
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
    integral(interval: IntervalVar): IntExpr;
    /** @internal */
    _stepFunctionIntegralInRange(interval: IntervalVar, lb: number, ub: number): Constraint;
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
    eval(arg: IntExpr | number): IntExpr;
    /** @internal */
    _stepFunctionEvalInRange(arg: IntExpr | number, lb: number, ub: number): Constraint;
    /** @internal */
    _stepFunctionEvalNotInRange(arg: IntExpr | number, lb: number, ub: number): Constraint;
    /** @internal @deprecated Use `IntStepFunction.integral` instead. */
    stepFunctionSum(interval: IntervalVar): IntExpr;
    /** @internal @deprecated Use `IntStepFunction.eval` instead. */
    stepFunctionEval(x: IntExpr): IntExpr;
}
/** @internal */
declare class SearchDecision extends ModelElement {
    readonly __brand: 'SearchDecision';
    /** @internal */
    static _Create(cp: Model, func: string, args: Array<Argument>): SearchDecision;
}
/**
 * @remarks
 * WorkerParameters specify the behavior of each worker separately.
 * It is part of the {@link Parameters} object.
 *
 * If a parameter is not listed here, then it can be set only globally (in {@link Parameters}), not per worker.  For example, _timeLimit_ or _logPeriod_ are
 * global parameters.
 *
 * @category Parameters
 */
export type WorkerParameters = {
    /**
     * Type of search to use
     *
     * @remarks
     * This parameter controls which search algorithm the solver uses. Different search types have different strengths:
     *
     * - `Auto`: Automatically determined based on the {@link Parameters.preset} (the default). With the `Default` preset, workers are distributed across LNS, FDS, and FDSDual. With the `Large` preset, all workers use LNS.
     *
     * - `LNS`: Large Neighborhood Search. Starts from an initial solution and iteratively improves it by relaxing and re-optimizing parts of the solution. Good for finding high-quality solutions quickly, especially on large problems. Works best when a good initial solution can be found.
     *
     * - `FDS`: Failure-Directed Search. A systematic search that learns from failures to guide exploration. Uses restarts with no-good learning. Often effective at proving optimality and works well with strong propagation.
     *
     * - `FDSDual`: Failure-Directed Search working on objective bounds. Similar to FDS but focuses on proving bounds on the objective value. Useful for optimization problems where you want to know how far from optimal your solutions are.
     *
     * - `SetTimes`: Depth-first set-times search (not restarted). A simple chronological search that assigns start times in order. Can be effective for tightly constrained problems but generally less robust than other methods.
     *
     * **Interaction with presets:**
     *
     * When `searchType` is set to `Auto`, the actual search type is determined by the {@link Parameters.preset}:
     *
     * - `Default` preset: Distributes workers across different search types. Half use LNS, 3/8 use FDS, and the rest use FDSDual. This portfolio approach provides robustness across different problem types.
     *
     * - `Large` preset: All workers use LNS. For very large problems, the overhead of systematic search methods like FDS becomes prohibitive, so LNS is used exclusively.
     *
     * If you explicitly set `searchType` to a specific value (not `Auto`), that value is used regardless of the preset.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model ...
     *
     * // Let the preset decide (default behavior)
     * let result = await model.solve();
     *
     * // Or explicitly use FDS for systematic search
     * result = await model.solve({ searchType: "FDS" });
     *
     * // Or use LNS for quick solutions on large problems
     * result = await model.solve({ searchType: "LNS" });
     * ```
     *
     * @see {@link Parameters.preset} for automatic configuration of search and propagation.
     * @see {@link Parameters.noOverlapPropagationLevel} which works well with FDS at higher levels.
     *
     * @category Major options
     */
    searchType?: "Auto" | "LNS" | "FDS" | "FDSDual" | "SetTimes" | "FDSLB";
    /**
     * Random seed
     *
     * @remarks
     * The solver breaks ties randomly using a pseudorandom number generator. This parameter sets the seed of the generator.
     *
     * Note that when {@link Parameters.nbWorkers} is more than 1 then there is also another source of randomness: the time it takes for a message to pass from one worker to another. Therefore with 1 worker the solver is deterministic (random behavior depends only on random seed). With more workers the solver is not deterministic.
     *
     * Even with the same random seed, the solver may behave differently on different platforms. This can be due to different implementations of certain functions such as `std::sort`.
     *
     * The parameter takes an integer value.
     *
     * The default value is `1`.
     *
     * @category Major options
     */
    randomSeed?: number;
    /** @internal */
    _workerFailLimit?: number;
    /** @internal */
    _workerBranchLimit?: number;
    /** @internal */
    _workerSolutionLimit?: number;
    /** @internal */
    _workerLNSStepLimit?: number;
    /** @internal */
    _workerRestartLimit?: number;
    /**
     * How much to propagate noOverlap constraints
     *
     * @remarks
     * This parameter controls the amount of propagation done for noOverlap constraints. Higher levels use more sophisticated algorithms that can detect more infeasibilities and prune more values from domains, but at the cost of increased computation time.
     *
     * **Propagation levels:**
     *
     * - Level 1: Basic timetable propagation only
     * - Level 2: Adds detectable precedences algorithm
     * - Level 3: Adds edge-finding reasoning
     * - Level 4: Maximum propagation with all available algorithms
     *
     * **Automatic selection (level 0):**
     *
     * When set to 0 (the default), the propagation level is determined automatically based on the {@link Parameters.preset}:
     *
     * - `Default` preset: Uses level 4 (maximum propagation)
     * - `Large` preset: Uses level 1 (minimum propagation for scalability)
     *
     * **Performance considerations:**
     *
     * More propagation doesn't necessarily mean better overall performance. The trade-off depends on your problem:
     *
     * - **Dense scheduling problems** with many overlapping intervals often benefit from higher propagation levels because the extra pruning reduces the search space significantly.
     *
     * - **Sparse problems** or **very large problems** may perform better with lower propagation levels because the overhead of sophisticated algorithms outweighs the benefit.
     *
     * - **FDS search** (see {@link Parameters.searchType}) typically benefits from higher propagation levels because it relies on strong propagation to guide the search.
     *
     * If you're unsure, start with the automatic selection (level 0) and let the preset choose. You can then experiment with explicit levels if needed.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model with noOverlap constraints ...
     *
     * // Let the preset decide (default)
     * let result = await model.solve();
     *
     * // Or use maximum propagation for dense problems
     * result = await model.solve({ noOverlapPropagationLevel: 4 });
     *
     * // Or use minimum propagation for very large problems
     * result = await model.solve({ noOverlapPropagationLevel: 1 });
     * ```
     *
     * @see {@link Parameters.preset} for automatic configuration of propagation levels.
     * @see {@link Parameters.searchType} for choosing the search algorithm.
     * @see {@link Model.noOverlap} for creating noOverlap constraints.
     *
     * @category Propagation levels
     */
    noOverlapPropagationLevel?: number;
    /**
     * How much to propagate constraints on cumul functions
     *
     * @remarks
     * This parameter controls the amount of propagation done for {@link CumulExpr.le} constraint when used with a sum of {@link Model.pulse} pulses.
     *
     * Higher levels use more sophisticated algorithms that can detect more infeasibilities and prune more values from domains, but at the cost of increased computation time.
     *
     * **Propagation levels:**
     *
     * - Level 1: Basic timetable propagation
     * - Level 2: Adds time-table edge-finding
     * - Level 3: Maximum propagation with all available algorithms
     *
     * **Automatic selection (level 0):**
     *
     * When set to 0 (the default), the propagation level is determined automatically based on the {@link Parameters.preset}:
     *
     * - `Default` preset: Uses level 3 (maximum propagation)
     * - `Large` preset: Uses level 1 (minimum propagation for scalability)
     *
     * **Performance considerations:**
     *
     * More propagation doesn't necessarily mean better overall performance. The trade-off depends on your problem:
     *
     * - **Resource-constrained problems** with tight capacity limits often benefit from higher propagation levels because cumulative reasoning can prune many infeasible assignments.
     *
     * - **Problems with loose resource constraints** may not benefit much from higher levels because the extra computation doesn't lead to significant pruning.
     *
     * - **Very large problems** may perform better with lower propagation levels because the overhead becomes prohibitive.
     *
     * - **FDS search** (see {@link Parameters.searchType}) typically benefits from higher propagation levels.
     *
     * If you're unsure, start with the automatic selection (level 0) and let the preset choose.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model with cumulative constraints ...
     *
     * // Let the preset decide (default)
     * let result = await model.solve();
     *
     * // Or use maximum propagation for resource-constrained problems
     * result = await model.solve({ cumulPropagationLevel: 3 });
     *
     * // Or use minimum propagation for very large problems
     * result = await model.solve({ cumulPropagationLevel: 1 });
     * ```
     *
     * @see {@link Parameters.preset} for automatic configuration of propagation levels.
     * @see {@link Parameters.searchType} for choosing the search algorithm.
     * @see {@link Model.pulse} for creating pulse contributions to cumulative functions.
     *
     * @category Propagation levels
     */
    cumulPropagationLevel?: number;
    /**
     * How much to propagate constraints on cumul functions
     *
     * @remarks
     * This parameter controls the amount of propagation done for {@link CumulExpr.le} and {@link CumulExpr.ge} when used together with steps ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}).
     *
     * The bigger the value, the more algorithms are used for propagation.
     * It means that more time is spent by the propagation, and possibly more values are removed from domains.
     * More propagation doesn't necessarily mean better performance.
     * FDS search (see {@link Parameters.searchType}) usually benefits from higher propagation levels.
     *
     * The parameter takes an integer value in range `1..2`.
     *
     * The default value is `1`.
     *
     * @category Propagation levels
     */
    reservoirPropagationLevel?: number;
    /**
     * How much to propagate position expressions on noOverlap constraints
     *
     * @remarks
     * This parameter controls the amount of propagation done for position expressions on noOverlap constraints.
     * The bigger the value, the more algorithms are used for propagation.
     * It means that more time is spent by the propagation, and possibly more values are removed from domains.
     * However, more propagation doesn't necessarily mean better performance.
     * FDS search (see {@link Parameters.searchType}) usually benefits from higher propagation levels.
     *
     * The parameter takes an integer value in range `1..3`.
     *
     * The default value is `2`.
     *
     * @category Propagation levels
     */
    positionPropagationLevel?: number;
    /**
     * How much to propagate integral expression
     *
     * @remarks
     * This parameter controls the amount of propagation done for {@link Model.integral} expressions.
     * In particular, it controls whether the propagation also affects the minimum and the maximum length of the associated interval variable:
     *
     * * `1`: The length is updated only once during initial constraint propagation.
     * * `2`: The length is updated every time the expression is propagated.
     *
     * The parameter takes an integer value in range `1..2`.
     *
     * The default value is `1`.
     *
     * @category Propagation levels
     */
    integralPropagationLevel?: number;
    /** @internal */
    _packPropagationLevel?: number;
    /** @internal */
    _itvMappingPropagationLevel?: number;
    /**
     * Level of search trace
     *
     * @remarks
     * This parameter is available only in the development edition of the solver.
     *
     * When set to a value bigger than zero, the solver prints a trace of the search.
     * The trace contains information about every choice taken by the solver.
     * The higher the value, the more information is printed.
     *
     * The parameter takes an integer value in range `0..5`.
     *
     * The default value is `0`.
     *
     * @category Trace
     */
    searchTraceLevel?: number;
    /**
     * Level of propagation trace
     *
     * @remarks
     * This parameter is available only in the development edition of the solver.
     *
     * When set to a value bigger than zero, the solver prints a trace of the propagation,
     * that is a line for every domain change.
     * The higher the value, the more information is printed.
     *
     * The parameter takes an integer value in range `0..5`.
     *
     * The default value is `0`.
     *
     * @category Trace
     */
    propagationTraceLevel?: number;
    /**
     * Initial rating for newly created choices
     *
     * @remarks
     * Default rating for newly created choices. Both left and right branches get the same rating.
     * Choice is initially permuted so that bigger domain change is the left branch.
     *
     * The parameter takes a floating point value in range `0.0..2.0`.
     *
     * The default value is `0.5`.
     *
     * @category Failure-Directed Search
     */
    fdsInitialRating?: number;
    /**
     * Weight of the reduction factor in rating computation
     *
     * @remarks
     * When computing the local rating of a branch, multiply reduction factor by the given weight.
     *
     * The parameter takes a floating point value in range `0.0..Infinity`.
     *
     * The default value is `1`.
     *
     * @category Failure-Directed Search
     */
    fdsReductionWeight?: number;
    /**
     * Length of average rating computed for choices
     *
     * @remarks
     * For the computation of rating of a branch. Arithmetic average is used until the branch
     * is taken at least FDSRatingAverageLength times. After that exponential moving average
     * is used with parameter alpha = 1 - 1 / FDSRatingAverageLength.
     *
     * The parameter takes an integer value in range `0..254`.
     *
     * The default value is `25`.
     *
     * @category Failure-Directed Search
     */
    fdsRatingAverageLength?: number;
    /**
     * When non-zero, alpha factor for rating updates
     *
     * @remarks
     * When this parameter is set to a non-zero, parameter FDSRatingAverageLength is ignored.
     * Instead, the rating of a branch is computed as an exponential moving average with the given parameter alpha.
     *
     * The parameter takes a floating point value in range `0..1`.
     *
     * The default value is `0`.
     *
     * @category Failure-Directed Search
     */
    fdsFixedAlpha?: number;
    /**
     * Whether to compare the local rating with the average
     *
     * @remarks
     * Possible values are:
     *
     *  * `Off` (the default): No comparison is done.
     *  * `Global`: Compare with the global average.
     *  * `Depth`: Compare with the average on the current search depth
     *
     * Arithmetic average is used for global and depth averages.
     *
     * The default value is `Off`.
     *
     * @category Failure-Directed Search
     */
    fdsRatingAverageComparison?: "Off" | "Global" | "Depth";
    /**
     * Reduction factor R for rating computation
     *
     * @remarks
     * Possible values are:
     *
     *  * `Normal` (the default): Normal reduction factor.
     *  * `Zero`: Factor is not used (it is 0 all the time).
     *  * `Random`: A random number in the range [0,1] is used instead.
     *
     * The default value is `Normal`.
     *
     * @category Failure-Directed Search
     */
    fdsReductionFactor?: "Normal" | "Zero" | "Random";
    /**
     * Whether always reuse closing choice
     *
     * @remarks
     * Most of the time, FDS reuses closing choice automatically. This parameter enforces it all the time.
     *
     * The default value is `False`.
     *
     * @category Failure-Directed Search
     */
    fdsReuseClosing?: boolean;
    /**
     * Whether all initial choices have the same step length
     *
     * @remarks
     * When set, then initial choices generated on interval variables will have the same step size.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsUniformChoiceStep?: boolean;
    /**
     * Choice step relative to average length
     *
     * @remarks
     * Ratio of initial choice step size to the minimum length of interval variable. When FDSUniformChoiceStep is set, this ratio is used to compute global choice step using the average of interval var length. When FDSUniformChoiceStep is not set, this ratio is used to compute the choice step for every interval var individually.
     *
     * The parameter takes a floating point value in range `0.0..Infinity`.
     *
     * The default value is `0.699999988079071`.
     *
     * @category Failure-Directed Search
     */
    fdsLengthStepRatio?: number;
    /**
     * Maximum number of choices generated initially per a variable
     *
     * @remarks
     * Initial domains are often very large (e.g., `0..IntervalMax`). Therefore initial
     * number of generated choices is limited: only choices near startMin are kept.
     *
     * The parameter takes an integer value in range `2..2147483647`.
     *
     * The default value is `90`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxInitialChoicesPerVariable?: number;
    /**
     * Domain split ratio when run out of choices
     *
     * @remarks
     * When all choices are decided, and a greedy algorithm cannot find a solution, then
     * more choices are generated by splitting domains into the specified number of pieces.
     *
     * The parameter takes a floating point value in range `2.0..Infinity`.
     *
     * The default value is `7`.
     *
     * @category Failure-Directed Search
     */
    fdsAdditionalStepRatio?: number;
    /**
     * Whether to generate choices on presence status
     *
     * @remarks
     * Choices on start time also include a choice on presence status. Therefore, dedicated choices on presence status only are not mandatory.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsPresenceStatusChoices?: boolean;
    /**
     * Maximum number of initial choices on length of an interval variable
     *
     * @remarks
     * When non-zero, this parameter limits the number of initial choices generated on length of an interval variable.
     * When zero (the default), no choices on length are generated.
     *
     * The parameter takes an integer value in range `0..2147483647`.
     *
     * The default value is `0`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxInitialLengthChoices?: number;
    /**
     * Maximum step when generating initial choices for length of an interval variable
     *
     * @remarks
     * Steps between choices for length of an interval variable are never bigger than the specified value.
     *
     * The parameter takes an integer value in range `1..1073741823`.
     *
     * The default value is `1073741823`.
     *
     * @category Failure-Directed Search
     */
    fdsMinLengthChoiceStep?: number;
    /**
     * Minimum step when generating choices for integer variables.
     *
     * @remarks
     * Steps between choices for integer variables are never smaller than the specified value.
     *
     * The parameter takes an integer value in range `1..1073741823`.
     *
     * The default value is `1073741823`.
     *
     * @category Failure-Directed Search
     */
    fdsMinIntVarChoiceStep?: number;
    /**
     * Influence of event time to initial choice rating
     *
     * @remarks
     * When non-zero, the initial choice rating is influenced by the date of the choice.
     * This way, very first choices in the search should be taken chronologically.
     *
     * The parameter takes a floating point value in range `0..1`.
     *
     * The default value is `0`.
     *
     * @category Failure-Directed Search
     */
    fdsEventTimeInfluence?: number;
    /**
     * How much to improve rating when both branches fail immediately
     *
     * @remarks
     * This parameter sets a bonus reward for a choice when both left and right branches fail immediately.
     * Current rating of both branches is multiplied by the specified value.
     *
     * The parameter takes a floating point value in range `0..1`.
     *
     * The default value is `0.98`.
     *
     * @category Failure-Directed Search
     */
    fdsBothFailRewardFactor?: number;
    /**
     * How often to chose a choice randomly
     *
     * @remarks
     * Probability that a choice is taken randomly. A randomly selected choice is not added to the search tree automatically. Instead, the choice is tried, its rating is updated,
     * but it is added to the search tree only if one of the branches fails.
     * The mechanism is similar to strong branching.
     *
     * The parameter takes a floating point value in range `0.0..0.99999`.
     *
     * The default value is `0.1`.
     *
     * @category Failure-Directed Search
     */
    fdsEpsilon?: number;
    /**
     * Number of choices to try in strong branching
     *
     * @remarks
     * Strong branching means that instead of taking a choice with the best rating,
     * we take the specified number (FDSStrongBranchingSize) of best choices,
     * try them in dry-run mode, measure their local rating, and
     * then chose the one with the best local rating.
     *
     * The parameter takes an integer value.
     *
     * The default value is `10`.
     *
     * @category Failure-Directed Search
     */
    fdsStrongBranchingSize?: number;
    /**
     * Up-to what search depth apply strong branching
     *
     * @remarks
     * Strong branching is typically used in the root node. This parameter controls
     * the maximum search depth when strong branching is used.
     *
     * The parameter takes an integer value.
     *
     * The default value is `6`.
     *
     * @category Failure-Directed Search
     */
    fdsStrongBranchingDepth?: number;
    /**
     * How to choose the best choice in strong branching
     *
     * @remarks
     * Possible values are:
     *
     * * `Both`: Choose the the choice with best combined rating.
     * * `Left` (the default): Choose the choice with the best rating of the left branch.
     * * `Right`: Choose the choice with the best rating of the right branch.
     *
     * The default value is `Left`.
     *
     * @category Failure-Directed Search
     */
    fdsStrongBranchingCriterion?: "Both" | "Left" | "Right";
    /**
     * Fail limit for the first restart
     *
     * @remarks
     * Failure-directed search is periodically restarted: explored part of the current search tree is turned into a no-good constraint, and the search starts again in the root node.
     * This parameter specifies the size of the very first search tree (measured in number of failures).
     *
     * The parameter takes an integer value in range `1..9223372036854775807`.
     *
     * The default value is `100`.
     *
     * @category Failure-Directed Search
     */
    fdsInitialRestartLimit?: number;
    /**
     * Restart strategy to use
     *
     * @remarks
     * This parameter specifies how the restart limit (maximum number of failures) changes from restart to restart.
     * Possible values are:
     *
     * * `Geometric` (the default): After each restart, restart limit is multiplied by {@link Parameters.fdsRestartGrowthFactor}.
     * * `Nested`: Similar to `Geometric` but the limit is changed back to {@link Parameters.fdsInitialRestartLimit} each time a new maximum limit is reached.
     * * `Luby`: Luby restart strategy is used. Parameter {@link Parameters.fdsRestartGrowthFactor} is ignored.
     *
     * The default value is `Geometric`.
     *
     * @category Failure-Directed Search
     */
    fdsRestartStrategy?: "Geometric" | "Nested" | "Luby";
    /**
     * Growth factor for fail limit after each restart
     *
     * @remarks
     * After each restart, the fail limit for the restart is multiplied by the specified factor.
     * This parameter is ignored when {@link Parameters.fdsRestartStrategy} is `Luby`.
     *
     * The parameter takes a floating point value in range `1.0..Infinity`.
     *
     * The default value is `1.15`.
     *
     * @category Failure-Directed Search
     */
    fdsRestartGrowthFactor?: number;
    /**
     * Truncate choice use counts after a restart to this value
     *
     * @remarks
     * The idea is that ratings learned in the previous restart are less valid in the new restart.
     * Using this parameter, it is possible to truncate use counts on choices so that new local ratings will have bigger weights (when FDSFixedAlpha is not used).
     *
     * The parameter takes an integer value.
     *
     * The default value is `255`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxCounterAfterRestart?: number;
    /**
     * Truncate choice use counts after a solution is found
     *
     * @remarks
     * Similar to {@link Parameters.fdsMaxCounterAfterRestart}, this parameter allows truncating use counts on choices when a solution is found.
     *
     * The parameter takes an integer value.
     *
     * The default value is `255`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxCounterAfterSolution?: number;
    /**
     * Reset restart size after a solution is found (ignored in Luby)
     *
     * @remarks
     * When this parameter is set (the default), then restart limit is set back to {@link Parameters.fdsInitialRestartLimit} when a solution is found.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsResetRestartsAfterSolution?: boolean;
    /**
     * Whether to use or not nogood constraints
     *
     * @remarks
     * By default, no-good constraint is generated after each restart. This parameter allows to turn no-good constraints off.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsUseNogoods?: boolean;
    /** @internal */
    _fdsFreezeRatingsAfterProof?: boolean;
    /** @internal */
    _fdsContinueAfterProof?: boolean;
    /** @internal */
    _fdsRepeatLimit?: number;
    /** @internal */
    _fdsCompletelyRandom?: boolean;
    /**
     * Whether to generate choices for objective expression/variable
     *
     * @remarks
     * This option controls the generation of choices on the objective. It works regardless of the objective is given by an expression or a variable.
     *
     * The default value is `False`.
     *
     * @category Failure-Directed Search
     */
    fdsBranchOnObjective?: boolean;
    /** @internal */
    _fdsImproveNogoods?: boolean;
    /**
     * Controls which side of a choice is explored first (considering the rating).
     *
     * @remarks
     * This option can take the following values:
     *
     * * `FailureFirst`: Explore the failure side first.
     * * `FailureLast`: Explore the failure side last.
     * * `Random`: Explore either side randomly.
     *
     * The default value is `FailureFirst`.
     *
     * @category Failure-Directed Search
     */
    fdsBranchOrdering?: "FailureFirst" | "FailureLast" | "Random";
    /** @internal */
    _fdsDiveBySetTimes?: boolean;
    /**
     * A strategy to choose objective cuts during FDSDual search.
     *
     * @remarks
     * Possible values are:
     *
     * * `Minimum`: Always change the cut by the minimum amount.
     * * `Random`: At each restart, randomly choose a value in range LB..UB. The default.
     * * `Split`: Always split the current range LB..UB in half.
     *
     * The default value is `Random`.
     *
     * @category Failure-Directed Search
     */
    fdsDualStrategy?: "Minimum" | "Random" | "Split";
    /**
     * Whether to reset ratings when a new LB is proved
     *
     * @remarks
     * When this parameter is on, and FDSDual proves a new lower bound, then all ratings are reset to default values.
     *
     * The default value is `False`.
     *
     * @category Failure-Directed Search
     */
    fdsDualResetRatings?: boolean;
    /** @internal */
    _lnsInitNoOverlapPropagationLevel?: number;
    /** @internal */
    _lnsInitCumulPropagationLevel?: number;
    /** @internal */
    _lnsFirstFailLimit?: number;
    /** @internal */
    _lnsFailLimitGrowthFactor?: number;
    /** @internal */
    _lnsFailLimitCoefficient?: number;
    /** @internal */
    _lnsIterationsAfterFirstSolution?: number;
    /** @internal */
    _lnsAggressiveDominance?: boolean;
    /** @internal */
    _lnsSameSolutionPeriod?: number;
    /** @internal */
    _lnsTier1Size?: number;
    /** @internal */
    _lnsTier2Size?: number;
    /** @internal */
    _lnsTier3Size?: number;
    /** @internal */
    _lnsTier2Effort?: number;
    /** @internal */
    _lnsTier3Effort?: number;
    /** @internal */
    _lnsStepFailLimitFactor?: number;
    /** @internal */
    _lnsApplyCutProbability?: number;
    /** @internal */
    _lnsSmallStructureLimit?: number;
    /** @internal */
    _lnsResourceOptimization?: boolean;
    /** @internal */
    _lnsRestoreAbsentIntervals?: boolean;
    /** @internal */
    _lnsRestoreIntervalLengths?: boolean;
    /** @internal */
    _lnsRestoreIntVarValues?: boolean;
    /**
     * Use only the user-provided warm start as the initial solution in LNS
     *
     * @remarks
     * When this parameter is on, the solver will use only the user-specified warm start solution for the initial solution phase in LNS. If no warm start is provided, the solver will search for its own initial solution as usual.
     *
     * The default value is `False`.
     *
     * @category Large Neighborhood Search
     */
    lnsUseWarmStartOnly?: boolean;
    /** @internal */
    _lnsHeuristicsEpsilon?: number;
    /** @internal */
    _lnsHeuristicsAlpha?: number;
    /** @internal */
    _lnsHeuristicsTemperature?: number;
    /** @internal */
    _lnsHeuristicsUniform?: boolean;
    /** @internal */
    _lnsHeuristicsInitialQ?: number;
    /** @internal */
    _lnsPortionEpsilon?: number;
    /** @internal */
    _lnsPortionAlpha?: number;
    /** @internal */
    _lnsPortionTemperature?: number;
    /** @internal */
    _lnsPortionUniform?: boolean;
    /** @internal */
    _lnsPortionInitialQ?: number;
    /** @internal */
    _lnsPortionHandicapLimit?: number;
    /** @internal */
    _lnsPortionHandicapValue?: number;
    /** @internal */
    _lnsPortionHandicapInitialQ?: number;
    /** @internal */
    _lnsNeighborhoodStrategy?: number;
    /** @internal */
    _lnsNeighborhoodEpsilon?: number;
    /** @internal */
    _lnsNeighborhoodAlpha?: number;
    /** @internal */
    _lnsNeighborhoodTemperature?: number;
    /** @internal */
    _lnsNeighborhoodUniform?: boolean;
    /** @internal */
    _lnsNeighborhoodInitialQ?: number;
    /** @internal */
    _lnsDivingLimit?: number;
    /** @internal */
    _lnsDivingFailLimitRatio?: number;
    /** @internal */
    _lnsLearningRun?: boolean;
    /** @internal */
    _lnsStayOnObjective?: boolean;
    /** @internal */
    _lnsFDS?: boolean;
    /** @internal */
    _lnsFreezeIntervalsBeforeFragment?: boolean;
    /** @internal */
    _lnsRelaxSlack?: number;
    /** @internal */
    _lnsPortionMultiplier?: number;
    /**
     * Which worker computes simple lower bound
     *
     * @remarks
     * Simple lower bound is a bound such that infeasibility of a better objective can be proved by propagation only (without the search). The given worker computes simple lower bound before it starts the normal search. If a worker with the given number doesn't exist, then the lower bound is not computed.
     *
     * The parameter takes an integer value in range `-1..2147483647`.
     *
     * The default value is `0`.
     *
     * @category Simple Lower Bound
     */
    simpleLBWorker?: number;
    /**
     * Maximum number of feasibility checks
     *
     * @remarks
     * Simple lower bound is computed by binary search for the best objective value that is not infeasible by propagation. This parameter limits the maximum number of iterations of the binary search. When the value is 0, then simple lower bound is not computed at all.
     *
     * The parameter takes an integer value in range `0..2147483647`.
     *
     * The default value is `2147483647`.
     *
     * @category Simple Lower Bound
     */
    simpleLBMaxIterations?: number;
    /**
     * Number of shaving rounds
     *
     * @remarks
     * When non-zero, the solver shaves on variable domains to improve the lower bound. This parameter controls the number of shaving rounds.
     *
     * The parameter takes an integer value in range `0..2147483647`.
     *
     * The default value is `0`.
     *
     * @category Simple Lower Bound
     */
    simpleLBShavingRounds?: number;
    /** @internal */
    _debugTraceLevel?: number;
    /** @internal */
    _memoryTraceLevel?: number;
    /** @internal */
    _propagationDetailTraceLevel?: number;
    /** @internal */
    _setTimesTraceLevel?: number;
    /** @internal */
    _communicationTraceLevel?: number;
    /** @internal */
    _conversionTraceLevel?: number;
    /** @internal */
    _expressionBuilderTraceLevel?: number;
    /** @internal */
    _memorizationTraceLevel?: number;
    /** @internal */
    _searchDetailTraceLevel?: number;
    /** @internal */
    _fdsTraceLevel?: number;
    /** @internal */
    _shavingTraceLevel?: number;
    /** @internal */
    _fdsRatingsTraceLevel?: number;
    /** @internal */
    _lnsTraceLevel?: number;
    /** @internal */
    _heuristicReplayTraceLevel?: number;
    /** @internal */
    _allowSetTimesProofs?: boolean;
    /** @internal */
    _setTimesAggressiveDominance?: boolean;
    /** @internal */
    _setTimesExtendsCoef?: number;
    /** @internal */
    _setTimesHeightStrategy?: "FromMax" | "FromMin" | "Random";
    /** @internal */
    _setTimesItvMappingStrategy?: "FromMax" | "FromMin" | "Random";
    /** @internal */
    _setTimesInitDensity?: number;
    /** @internal */
    _setTimesDensityLength?: number;
    /** @internal */
    _setTimesDensityReliabilityThreshold?: number;
    /** @internal */
    _setTimesNbExtendsFactor?: number;
    /** @internal */
    _discreteLowCapacityLimit?: number;
    /** @internal */
    _lnsTrainingObjectiveLimit?: number;
    /** @internal */
    _posAbsentRelated?: boolean;
    /** @internal */
    _defaultCallbackBlockSize?: number;
    /** @internal */
    _useReservoirPegging?: boolean;
    /** @internal */
    _useTimeNet?: boolean;
    /** @internal */
    _timeNetVarsToPreprocess?: number;
    /** @internal */
    _timeNetSubPriorityBits?: number;
};
/**
 * @remarks
 * Parameters specify how the solver should behave.  For example, the
 * number of workers (threads) to use, the time limit, etc.
 *
 * Parameters can be passed to the solver functions {@link Model.solve}
 * and {@link Solver.solve}.
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
 * let result = await myModel.solve(params);
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
 *   timeLimit: 60,       // In seconds, i.e. 1 minute
 *   searchType: "LNS",   // The default search type. It is not necessary, as "LNS" is the default value.
 *   nbWorkers: 4,        // Use 4 threads
 *   // The first two workers will use FDS search.
 *   // The remaining two workers will use the defaults, i.e., LNS search with default propagation levels.
 *   workers = [fdsWorker, fdsWorker];
 * };
 * let result = await myModel.solve(params);
 * ```
 *
 * @see {@link WorkerParameters} for worker-specific parameters.
 *
 * @category Parameters
 */
export type Parameters = {
    /**
     * Per-worker parameter overrides.
     *
     * @remarks
     * Each worker can have its own parameters. If a parameter is not specified
     * for a worker, then the global value is used.
     *
     * Note that parameter {@link Parameters.nbWorkers} specifies the number of
     * workers regardless of the length of this list.
     *
     * @see {@link WorkerParameters} for the list of parameters that can be set per worker.
     *
     * @category Parameters
     */
    workers?: WorkerParameters[];
    /**
     * Path to the solver executable or WebSocket URL.
     *
     * @remarks
     * Specifies how to connect to the solver.
     *
     * - **Local path**: Path to the `optalcp` executable (e.g., `/usr/bin/optalcp`). The
     *   API spawns the solver as a subprocess.
     * - **WebSocket URL**: URL starting with `ws://`, `wss://`, `http://`, or `https://`
     *   (e.g., `ws://localhost:8080`). The API connects via WebSocket to a remote solver.
     *   In browser environments, a WebSocket URL is required since browsers cannot spawn
     *   local processes.
     *
     * If not specified, the solver is searched as described in {@link Solver.findSolver}.
     *
     * @see {@link Solver.findSolver} for solver discovery logic.
     * @see {@link Parameters.solverArgs} for additional subprocess arguments.
     *
     * @category Parameters
     */
    solver?: string;
    /**
     * Additional command-line arguments for the solver subprocess.
     *
     * @remarks
     * These arguments are passed directly to the solver subprocess when it is spawned.
     * This parameter is only used in subprocess mode (not when connecting to a remote
     * solver via WebSocket).
     *
     * This can be useful for debugging or passing special flags to the solver that are
     * not exposed through the Parameters API.
     *
     * ```ts
     * import * as cp from '@scheduleopt/optalcp';
     *
     * const model = new cp.Model();
     * // ... build model ...
     *
     * // Pass custom arguments to the solver
     * const result = await model.solve({
     *   solverArgs: ['--some-debug-flag'],
     *   timeLimit: 60
     * });
     * ```
     *
     * @see {@link Parameters.solver} to specify a custom solver path.
     *
     * @category Parameters
     */
    solverArgs?: string[];
    /**
     * Where to write solver log output.
     *
     * @remarks
     * Controls where solver log messages, warnings, and errors are written during solving.
     *
     * **Node.js:**
     *
     * - `undefined` (default): Write to console (`process.stdout`)
     * - `false`: Suppress all output
     * - `true`: Write to console (explicit)
     * - `WritableStream`: Write to the provided stream
     *
     * **Browser:**
     *
     * - `undefined` (default): Silent (no output)
     * - `false`: Silent
     * - `true`: Write to browser console
     *
     * Note that setting `printLog` to `false` only suppresses writing to the output stream. The solver still emits `log`, `warning`, and `error` events that can be intercepted using callback properties ({@link Solver.onLog}, {@link Solver.onWarning}, {@link Solver.onError}). To reduce the amount of logging at the source, use {@link Parameters.logLevel}.
     *
     * **ANSI colors:** When writing to a stream, the solver automatically detects whether the stream supports colors by checking its `isTTY` property. In browser environment, colors are always disabled. To override automatic detection, use the {@link Parameters.color} parameter.
     *
     * If the output stream becomes non-writable (e.g., a broken pipe), then the solver stops as soon as possible.
     *
     * ```ts
     * // Default - Node.js logs to console, browser is silent
     * await model.solve();
     *
     * // Silent - no output
     * await model.solve({ printLog: false });
     *
     * // Console output (useful in browser)
     * await model.solve({ printLog: true });
     *
     * // Custom stream (Node.js only)
     * import * as fs from 'fs';
     * await model.solve({ printLog: fs.createWriteStream('solver.log') });
     * ```
     *
     * @see {@link Parameters.logLevel} to control verbosity.
     * @see {@link Parameters.color} to override automatic color detection.
     */
    printLog?: boolean;
    /**
     * @internal @deprecated Use `parseParameters({ usage: "..." })` instead.
     */
    usage?: string;
    /**
     * Whether to colorize output to the terminal
     *
     * @remarks
     * This parameter controls when terminal output is colorized. Possible values are:
     *
     * *  `Never`: don't colorize the output.
     * *  `Auto`: colorize if the output is a supported terminal.
     * *  `Always`: always colorize the output.
     *
     * The default value is `Auto`.
     *
     * @category Terminal output
     */
    color?: "Never" | "Auto" | "Always";
    /**
     * Number of threads dedicated to search
     *
     * @remarks
     * When this parameter is 0 (the default), the number of workers is determined the following way:
     *
     *  * If environment variable `OPTALCP_NB_WORKERS` is set, its value is used.
     *  * Otherwise, all available cores are used.
     *
     * The parameter takes an integer value.
     *
     * The default value is `0`.
     *
     * @category Major options
     */
    nbWorkers?: number;
    /** @internal */
    _nbHelpers?: number;
    /**
     * Preset configuration for solver parameters
     *
     * @remarks
     * Presets provide reasonable default values for multiple solver parameters at once. Instead of manually tuning individual parameters, you can select a preset that matches your problem characteristics. The solver will then configure search strategies and propagation levels appropriately.
     *
     * **Available presets:**
     *
     * - `Auto`: The solver automatically selects a preset based on problem size (the default). Problems with more than 100,000 variables use `Large`, otherwise `Default`.
     *
     * - `Default`: Balanced configuration for most problems. Uses maximum propagation levels and distributes workers across different search strategies: half use LNS, 3/8 use FDS, and the rest use FDSDual. This provides a good mix of exploration and exploitation.
     *
     * - `Large`: Optimized for big problems with more than 100,000 variables. Uses minimum propagation to reduce overhead, and all workers use LNS search. This trades propagation strength for scalability.
     *
     * **Parameters affected by presets:**
     *
     * The preset sets default values for the following parameters:
     *
     * - {@link Parameters.searchType}: How workers are distributed across LNS, FDS, and FDSDual
     * - {@link Parameters.noOverlapPropagationLevel}: Propagation strength for noOverlap constraints
     * - {@link Parameters.cumulPropagationLevel}: Propagation strength for cumulative constraints
     *
     * When you explicitly set any of these parameters, your value takes precedence over the preset's default. This allows you to use a preset as a starting point and fine-tune specific parameters as needed.
     *
     * **When to use presets:**
     *
     * Presets are a good starting point for most problems. They are not guaranteed to be optimal for your specific problem, but they provide reasonable defaults that work well in practice. If you find that the default preset is not working well for your problem, consider:
     *
     * - Trying the `Large` preset for very big problems, even if they have fewer than 100,000 variables
     * - Explicitly setting {@link Parameters.searchType} to use a specific search strategy
     * - Adjusting propagation levels based on your problem structure
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model ...
     *
     * // Use automatic preset selection
     * let result = await model.solve();
     *
     * // Or explicitly select a preset for a large problem
     * result = await model.solve({ preset: "Large" });
     *
     * // Or use Default preset but override search type
     * result = await model.solve({ preset: "Default", searchType: "FDS" });
     * ```
     *
     * @see {@link Parameters.searchType} for choosing the search algorithm.
     * @see {@link Parameters.noOverlapPropagationLevel} for tuning noOverlap propagation.
     * @see {@link Parameters.cumulPropagationLevel} for tuning cumulative propagation.
     *
     * @category Major options
     */
    preset?: "Auto" | "Default" | "Large";
    /**
     * Type of search to use
     *
     * @remarks
     * This parameter controls which search algorithm the solver uses. Different search types have different strengths:
     *
     * - `Auto`: Automatically determined based on the {@link Parameters.preset} (the default). With the `Default` preset, workers are distributed across LNS, FDS, and FDSDual. With the `Large` preset, all workers use LNS.
     *
     * - `LNS`: Large Neighborhood Search. Starts from an initial solution and iteratively improves it by relaxing and re-optimizing parts of the solution. Good for finding high-quality solutions quickly, especially on large problems. Works best when a good initial solution can be found.
     *
     * - `FDS`: Failure-Directed Search. A systematic search that learns from failures to guide exploration. Uses restarts with no-good learning. Often effective at proving optimality and works well with strong propagation.
     *
     * - `FDSDual`: Failure-Directed Search working on objective bounds. Similar to FDS but focuses on proving bounds on the objective value. Useful for optimization problems where you want to know how far from optimal your solutions are.
     *
     * - `SetTimes`: Depth-first set-times search (not restarted). A simple chronological search that assigns start times in order. Can be effective for tightly constrained problems but generally less robust than other methods.
     *
     * **Interaction with presets:**
     *
     * When `searchType` is set to `Auto`, the actual search type is determined by the {@link Parameters.preset}:
     *
     * - `Default` preset: Distributes workers across different search types. Half use LNS, 3/8 use FDS, and the rest use FDSDual. This portfolio approach provides robustness across different problem types.
     *
     * - `Large` preset: All workers use LNS. For very large problems, the overhead of systematic search methods like FDS becomes prohibitive, so LNS is used exclusively.
     *
     * If you explicitly set `searchType` to a specific value (not `Auto`), that value is used regardless of the preset.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model ...
     *
     * // Let the preset decide (default behavior)
     * let result = await model.solve();
     *
     * // Or explicitly use FDS for systematic search
     * result = await model.solve({ searchType: "FDS" });
     *
     * // Or use LNS for quick solutions on large problems
     * result = await model.solve({ searchType: "LNS" });
     * ```
     *
     * @see {@link Parameters.preset} for automatic configuration of search and propagation.
     * @see {@link Parameters.noOverlapPropagationLevel} which works well with FDS at higher levels.
     *
     * @category Major options
     */
    searchType?: "Auto" | "LNS" | "FDS" | "FDSDual" | "SetTimes" | "FDSLB";
    /**
     * Random seed
     *
     * @remarks
     * The solver breaks ties randomly using a pseudorandom number generator. This parameter sets the seed of the generator.
     *
     * Note that when {@link Parameters.nbWorkers} is more than 1 then there is also another source of randomness: the time it takes for a message to pass from one worker to another. Therefore with 1 worker the solver is deterministic (random behavior depends only on random seed). With more workers the solver is not deterministic.
     *
     * Even with the same random seed, the solver may behave differently on different platforms. This can be due to different implementations of certain functions such as `std::sort`.
     *
     * The parameter takes an integer value.
     *
     * The default value is `1`.
     *
     * @category Major options
     */
    randomSeed?: number;
    /**
     * Level of the log
     *
     * @remarks
     * This parameter controls the amount of text the solver writes on standard output. The solver is completely silent when this option is set to 0.
     *
     * The parameter takes an integer value in range `0..3`.
     *
     * The default value is `2`.
     *
     * @category Major options
     */
    logLevel?: number;
    /**
     * Level of warnings
     *
     * @remarks
     * This parameter controls the types of warnings the solver emits. When this parameter is set to 0 then no warnings are emitted.
     *
     * The parameter takes an integer value in range `0..3`.
     *
     * The default value is `2`.
     *
     * @category Major options
     */
    warningLevel?: number;
    /**
     * How often to print log messages (in seconds)
     *
     * @remarks
     * When {@link Parameters.logLevel} &ge; 2 then solver writes a log message every `logPeriod` seconds. The log message contains the current statistics about the solve: number of branches, number of fails, memory used, etc.
     *
     * The parameter takes a floating point value in range `0.01..Infinity`.
     *
     * The default value is `10`.
     *
     * @category Major options
     */
    logPeriod?: number;
    /**
     * When on, the correctness of solutions is verified
     *
     * @remarks
     * Verification is an independent algorithm that checks whether all constraints in the model are satisfied (or absent), and that objective value was computed correctly. Verification is a somewhat redundant process as all solutions should be correct. Its purpose is to double-check and detect bugs in the solver.
     *
     * The default value is `False`.
     *
     * @category Major options
     */
    verifySolutions?: boolean;
    /**
     * Whether to verify correctness of external solutions
     *
     * @remarks
     * External solutions can be passed to the solver as a warm start via {@link Model.solve}, or using {@link Solver.sendSolution} during the search. Normally, all external solutions are checked before they are used. However, the check may be time consuming, especially if too many external solutions are sent simultaneously. This parameter allows to turn the check off.
     *
     * The default value is `True`.
     *
     * @category Major options
     */
    verifyExternalSolutions?: boolean;
    /**
     * The minimal amount of memory in kB for a single allocation
     *
     * @remarks
     * The solver allocates memory in blocks. This parameter sets the minimal size of a block. Larger blocks mean a higher risk of wasting memory. However, larger blocks may also lead to better performance, particularly when the size matches the page size supported by the operating system.
     *
     * The value of this parameter must be a power of 2.
     *
     * The default value of 2048 means 2MB, which means that up to ~12MB can be wasted per worker in the worst case.
     *
     * The parameter takes an integer value in range `4..1073741824`.
     *
     * The default value is `2048`.
     *
     * @category Major options
     */
    allocationBlockSize?: number;
    /**
     * Timeout for solver process to exit after finishing
     *
     * @remarks
     * After the solver finishes, wait up to this many seconds for the process to exit. If it doesn't exit in time, it is silently killed.
     *
     * The parameter takes a floating point value in range `0.0..Infinity`.
     *
     * The default value is `3`.
     *
     * @category Major options
     */
    processExitTimeout?: number;
    /**
     * Wall clock limit for execution in seconds
     *
     * @remarks
     * Caps the total wall-clock time spent by the solver. The timer starts as soon as the solve begins, and it includes presolve, search, and verification. When the limit is reached, all workers stop cooperatively. Leave it at the default `Infinity` to run without a time bound.
     *
     * The parameter takes a floating point value in range `0.0..Infinity`.
     *
     * The default value is `Infinity`.
     *
     * @category Limits
     */
    timeLimit?: number;
    /**
     * Stop the search after the given number of solutions
     *
     * @remarks
     * Terminates the solve after the specified number of solutions have been found and reported.
     *
     * **Automatic behavior (value 0):**
     *
     * When set to 0 (the default), the limit is determined automatically based on the problem type:
     *
     * - **Decision problems** (no objective): The solver stops after finding the first solution. This is usually what you want for feasibility problems.
     *
     * - **Optimization problems**: No limit is applied. The solver continues searching for better solutions until it proves optimality, hits another limit (like {@link Parameters.timeLimit}), or is stopped manually.
     *
     * **Explicit values:**
     *
     * You can set an explicit limit to control solution enumeration:
     *
     * - `1`: Stop after the first solution. Useful when you just need any feasible solution quickly, even for optimization problems.
     *
     * - `N > 1`: Find up to N solutions. Useful for:
     *    - Generating multiple alternative solutions for warm starts
     *    - Enumerating all solutions to small problems
     *    - Finding a diverse set of solutions for analysis
     *
     * **Note on optimization problems:**
     *
     * For optimization problems, only improving solutions are counted. If you set `solutionLimit=5`, the solver will stop after finding 5 solutions, each better than the previous. Non-improving solutions (which can occur during the search) are not counted toward the limit.
     *
     * **Note on LNS and decision problems:**
     *
     * When using LNS search (see {@link Parameters.searchType}) on decision problems (no objective), be aware that LNS may report duplicate solutions. LNS works by iteratively improving a solution, and for decision problems without an objective to guide the search, it may find the same solution multiple times. If you need unique solutions, consider using FDS search instead, or filter duplicates in your application code.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model ...
     *
     * // Automatic behavior (default)
     * // - Decision problem: stops after 1 solution
     * // - Optimization: no limit
     * let result = await model.solve();
     *
     * // Stop after first solution (useful for quick feasibility check)
     * result = await model.solve({ solutionLimit: 1 });
     *
     * // Find up to 10 solutions for warm starts
     * result = await model.solve({ solutionLimit: 10 });
     * ```
     *
     * @see {@link Parameters.timeLimit} for limiting solve time.
     *
     * @category Limits
     */
    solutionLimit?: number;
    /** @internal */
    _workerFailLimit?: number;
    /** @internal */
    _workerBranchLimit?: number;
    /** @internal */
    _workerSolutionLimit?: number;
    /** @internal */
    _workerLNSStepLimit?: number;
    /** @internal */
    _workerRestartLimit?: number;
    /**
     * Stop the search when the gap is below the tolerance
     *
     * @remarks
     * The search is stopped if the absolute difference between the current solution
     * value and current lower/upper bound is not bigger than the specified value.
     *
     * This parameter works together with {@link Parameters.relativeGapTolerance} as an OR condition: the search stops when *either* the absolute gap or the relative gap is within tolerance.
     *
     * The parameter takes a floating point value.
     *
     * The default value is `0`.
     *
     * @category Gap Tolerance
     */
    absoluteGapTolerance?: number;
    /**
     * Stop the search when the gap is below the tolerance
     *
     * @remarks
     * The search is stopped if the relative difference between the current solution
     * value and current lower/upper bound is not bigger than the specified value.
     *
     * This parameter works together with {@link Parameters.absoluteGapTolerance} as an OR condition: the search stops when *either* the absolute gap or the relative gap is within tolerance.
     *
     * The parameter takes a floating point value.
     *
     * The default value is `0.0001`.
     *
     * @category Gap Tolerance
     */
    relativeGapTolerance?: number;
    /** @internal */
    _tagsFromNames?: "Never" | "Auto" | "Merge" | "Force";
    /**
     * How much to propagate noOverlap constraints
     *
     * @remarks
     * This parameter controls the amount of propagation done for noOverlap constraints. Higher levels use more sophisticated algorithms that can detect more infeasibilities and prune more values from domains, but at the cost of increased computation time.
     *
     * **Propagation levels:**
     *
     * - Level 1: Basic timetable propagation only
     * - Level 2: Adds detectable precedences algorithm
     * - Level 3: Adds edge-finding reasoning
     * - Level 4: Maximum propagation with all available algorithms
     *
     * **Automatic selection (level 0):**
     *
     * When set to 0 (the default), the propagation level is determined automatically based on the {@link Parameters.preset}:
     *
     * - `Default` preset: Uses level 4 (maximum propagation)
     * - `Large` preset: Uses level 1 (minimum propagation for scalability)
     *
     * **Performance considerations:**
     *
     * More propagation doesn't necessarily mean better overall performance. The trade-off depends on your problem:
     *
     * - **Dense scheduling problems** with many overlapping intervals often benefit from higher propagation levels because the extra pruning reduces the search space significantly.
     *
     * - **Sparse problems** or **very large problems** may perform better with lower propagation levels because the overhead of sophisticated algorithms outweighs the benefit.
     *
     * - **FDS search** (see {@link Parameters.searchType}) typically benefits from higher propagation levels because it relies on strong propagation to guide the search.
     *
     * If you're unsure, start with the automatic selection (level 0) and let the preset choose. You can then experiment with explicit levels if needed.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model with noOverlap constraints ...
     *
     * // Let the preset decide (default)
     * let result = await model.solve();
     *
     * // Or use maximum propagation for dense problems
     * result = await model.solve({ noOverlapPropagationLevel: 4 });
     *
     * // Or use minimum propagation for very large problems
     * result = await model.solve({ noOverlapPropagationLevel: 1 });
     * ```
     *
     * @see {@link Parameters.preset} for automatic configuration of propagation levels.
     * @see {@link Parameters.searchType} for choosing the search algorithm.
     * @see {@link Model.noOverlap} for creating noOverlap constraints.
     *
     * @category Propagation levels
     */
    noOverlapPropagationLevel?: number;
    /**
     * How much to propagate constraints on cumul functions
     *
     * @remarks
     * This parameter controls the amount of propagation done for {@link CumulExpr.le} constraint when used with a sum of {@link Model.pulse} pulses.
     *
     * Higher levels use more sophisticated algorithms that can detect more infeasibilities and prune more values from domains, but at the cost of increased computation time.
     *
     * **Propagation levels:**
     *
     * - Level 1: Basic timetable propagation
     * - Level 2: Adds time-table edge-finding
     * - Level 3: Maximum propagation with all available algorithms
     *
     * **Automatic selection (level 0):**
     *
     * When set to 0 (the default), the propagation level is determined automatically based on the {@link Parameters.preset}:
     *
     * - `Default` preset: Uses level 3 (maximum propagation)
     * - `Large` preset: Uses level 1 (minimum propagation for scalability)
     *
     * **Performance considerations:**
     *
     * More propagation doesn't necessarily mean better overall performance. The trade-off depends on your problem:
     *
     * - **Resource-constrained problems** with tight capacity limits often benefit from higher propagation levels because cumulative reasoning can prune many infeasible assignments.
     *
     * - **Problems with loose resource constraints** may not benefit much from higher levels because the extra computation doesn't lead to significant pruning.
     *
     * - **Very large problems** may perform better with lower propagation levels because the overhead becomes prohibitive.
     *
     * - **FDS search** (see {@link Parameters.searchType}) typically benefits from higher propagation levels.
     *
     * If you're unsure, start with the automatic selection (level 0) and let the preset choose.
     *
     * ```ts
     * import * as CP from "optalcp";
     *
     * let model = new CP.Model();
     * // ... build your model with cumulative constraints ...
     *
     * // Let the preset decide (default)
     * let result = await model.solve();
     *
     * // Or use maximum propagation for resource-constrained problems
     * result = await model.solve({ cumulPropagationLevel: 3 });
     *
     * // Or use minimum propagation for very large problems
     * result = await model.solve({ cumulPropagationLevel: 1 });
     * ```
     *
     * @see {@link Parameters.preset} for automatic configuration of propagation levels.
     * @see {@link Parameters.searchType} for choosing the search algorithm.
     * @see {@link Model.pulse} for creating pulse contributions to cumulative functions.
     *
     * @category Propagation levels
     */
    cumulPropagationLevel?: number;
    /**
     * How much to propagate constraints on cumul functions
     *
     * @remarks
     * This parameter controls the amount of propagation done for {@link CumulExpr.le} and {@link CumulExpr.ge} when used together with steps ({@link Model.stepAtStart}, {@link Model.stepAtEnd}, {@link Model.stepAt}).
     *
     * The bigger the value, the more algorithms are used for propagation.
     * It means that more time is spent by the propagation, and possibly more values are removed from domains.
     * More propagation doesn't necessarily mean better performance.
     * FDS search (see {@link Parameters.searchType}) usually benefits from higher propagation levels.
     *
     * The parameter takes an integer value in range `1..2`.
     *
     * The default value is `1`.
     *
     * @category Propagation levels
     */
    reservoirPropagationLevel?: number;
    /**
     * How much to propagate position expressions on noOverlap constraints
     *
     * @remarks
     * This parameter controls the amount of propagation done for position expressions on noOverlap constraints.
     * The bigger the value, the more algorithms are used for propagation.
     * It means that more time is spent by the propagation, and possibly more values are removed from domains.
     * However, more propagation doesn't necessarily mean better performance.
     * FDS search (see {@link Parameters.searchType}) usually benefits from higher propagation levels.
     *
     * The parameter takes an integer value in range `1..3`.
     *
     * The default value is `2`.
     *
     * @category Propagation levels
     */
    positionPropagationLevel?: number;
    /**
     * How much to propagate integral expression
     *
     * @remarks
     * This parameter controls the amount of propagation done for {@link Model.integral} expressions.
     * In particular, it controls whether the propagation also affects the minimum and the maximum length of the associated interval variable:
     *
     * * `1`: The length is updated only once during initial constraint propagation.
     * * `2`: The length is updated every time the expression is propagated.
     *
     * The parameter takes an integer value in range `1..2`.
     *
     * The default value is `1`.
     *
     * @category Propagation levels
     */
    integralPropagationLevel?: number;
    /**
     * Whether to use precedence energy propagation algorithm
     *
     * @remarks
     * Precedence energy algorithm improves propagation of precedence constraints when an interval has multiple predecessors (or successors) which use the same resource (noOverlap or cumulative constraint). In this case, the predecessors (or successors) may be in disjunction. Precedence energy algorithm can leverage this information and propagate the precedence constraint more aggressively.
     *
     * The parameter takes an integer value: `0` to disable, `1` to enable.
     *
     * The default value is `0`.
     *
     * @category Propagation levels
     */
    usePrecedenceEnergy?: number;
    /** @internal */
    _packPropagationLevel?: number;
    /** @internal */
    _itvMappingPropagationLevel?: number;
    /**
     * Level of search trace
     *
     * @remarks
     * This parameter is available only in the development edition of the solver.
     *
     * When set to a value bigger than zero, the solver prints a trace of the search.
     * The trace contains information about every choice taken by the solver.
     * The higher the value, the more information is printed.
     *
     * The parameter takes an integer value in range `0..5`.
     *
     * The default value is `0`.
     *
     * @category Trace
     */
    searchTraceLevel?: number;
    /**
     * Level of propagation trace
     *
     * @remarks
     * This parameter is available only in the development edition of the solver.
     *
     * When set to a value bigger than zero, the solver prints a trace of the propagation,
     * that is a line for every domain change.
     * The higher the value, the more information is printed.
     *
     * The parameter takes an integer value in range `0..5`.
     *
     * The default value is `0`.
     *
     * @category Trace
     */
    propagationTraceLevel?: number;
    /**
     * Level of information trace
     *
     * @remarks
     * This parameter is available only in the development edition of the solver.
     *
     * When set to a value bigger than zero, the solver prints various high-level information.
     * The higher the value, the more information is printed.
     *
     * The parameter takes an integer value in range `0..5`.
     *
     * The default value is `0`.
     *
     * @category Trace
     */
    infoTraceLevel?: number;
    /**
     * Initial rating for newly created choices
     *
     * @remarks
     * Default rating for newly created choices. Both left and right branches get the same rating.
     * Choice is initially permuted so that bigger domain change is the left branch.
     *
     * The parameter takes a floating point value in range `0.0..2.0`.
     *
     * The default value is `0.5`.
     *
     * @category Failure-Directed Search
     */
    fdsInitialRating?: number;
    /**
     * Weight of the reduction factor in rating computation
     *
     * @remarks
     * When computing the local rating of a branch, multiply reduction factor by the given weight.
     *
     * The parameter takes a floating point value in range `0.0..Infinity`.
     *
     * The default value is `1`.
     *
     * @category Failure-Directed Search
     */
    fdsReductionWeight?: number;
    /**
     * Length of average rating computed for choices
     *
     * @remarks
     * For the computation of rating of a branch. Arithmetic average is used until the branch
     * is taken at least FDSRatingAverageLength times. After that exponential moving average
     * is used with parameter alpha = 1 - 1 / FDSRatingAverageLength.
     *
     * The parameter takes an integer value in range `0..254`.
     *
     * The default value is `25`.
     *
     * @category Failure-Directed Search
     */
    fdsRatingAverageLength?: number;
    /**
     * When non-zero, alpha factor for rating updates
     *
     * @remarks
     * When this parameter is set to a non-zero, parameter FDSRatingAverageLength is ignored.
     * Instead, the rating of a branch is computed as an exponential moving average with the given parameter alpha.
     *
     * The parameter takes a floating point value in range `0..1`.
     *
     * The default value is `0`.
     *
     * @category Failure-Directed Search
     */
    fdsFixedAlpha?: number;
    /**
     * Whether to compare the local rating with the average
     *
     * @remarks
     * Possible values are:
     *
     *  * `Off` (the default): No comparison is done.
     *  * `Global`: Compare with the global average.
     *  * `Depth`: Compare with the average on the current search depth
     *
     * Arithmetic average is used for global and depth averages.
     *
     * The default value is `Off`.
     *
     * @category Failure-Directed Search
     */
    fdsRatingAverageComparison?: "Off" | "Global" | "Depth";
    /**
     * Reduction factor R for rating computation
     *
     * @remarks
     * Possible values are:
     *
     *  * `Normal` (the default): Normal reduction factor.
     *  * `Zero`: Factor is not used (it is 0 all the time).
     *  * `Random`: A random number in the range [0,1] is used instead.
     *
     * The default value is `Normal`.
     *
     * @category Failure-Directed Search
     */
    fdsReductionFactor?: "Normal" | "Zero" | "Random";
    /**
     * Whether always reuse closing choice
     *
     * @remarks
     * Most of the time, FDS reuses closing choice automatically. This parameter enforces it all the time.
     *
     * The default value is `False`.
     *
     * @category Failure-Directed Search
     */
    fdsReuseClosing?: boolean;
    /**
     * Whether all initial choices have the same step length
     *
     * @remarks
     * When set, then initial choices generated on interval variables will have the same step size.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsUniformChoiceStep?: boolean;
    /**
     * Choice step relative to average length
     *
     * @remarks
     * Ratio of initial choice step size to the minimum length of interval variable. When FDSUniformChoiceStep is set, this ratio is used to compute global choice step using the average of interval var length. When FDSUniformChoiceStep is not set, this ratio is used to compute the choice step for every interval var individually.
     *
     * The parameter takes a floating point value in range `0.0..Infinity`.
     *
     * The default value is `0.699999988079071`.
     *
     * @category Failure-Directed Search
     */
    fdsLengthStepRatio?: number;
    /**
     * Maximum number of choices generated initially per a variable
     *
     * @remarks
     * Initial domains are often very large (e.g., `0..IntervalMax`). Therefore initial
     * number of generated choices is limited: only choices near startMin are kept.
     *
     * The parameter takes an integer value in range `2..2147483647`.
     *
     * The default value is `90`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxInitialChoicesPerVariable?: number;
    /**
     * Domain split ratio when run out of choices
     *
     * @remarks
     * When all choices are decided, and a greedy algorithm cannot find a solution, then
     * more choices are generated by splitting domains into the specified number of pieces.
     *
     * The parameter takes a floating point value in range `2.0..Infinity`.
     *
     * The default value is `7`.
     *
     * @category Failure-Directed Search
     */
    fdsAdditionalStepRatio?: number;
    /**
     * Whether to generate choices on presence status
     *
     * @remarks
     * Choices on start time also include a choice on presence status. Therefore, dedicated choices on presence status only are not mandatory.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsPresenceStatusChoices?: boolean;
    /**
     * Maximum number of initial choices on length of an interval variable
     *
     * @remarks
     * When non-zero, this parameter limits the number of initial choices generated on length of an interval variable.
     * When zero (the default), no choices on length are generated.
     *
     * The parameter takes an integer value in range `0..2147483647`.
     *
     * The default value is `0`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxInitialLengthChoices?: number;
    /**
     * Maximum step when generating initial choices for length of an interval variable
     *
     * @remarks
     * Steps between choices for length of an interval variable are never bigger than the specified value.
     *
     * The parameter takes an integer value in range `1..1073741823`.
     *
     * The default value is `1073741823`.
     *
     * @category Failure-Directed Search
     */
    fdsMinLengthChoiceStep?: number;
    /**
     * Minimum step when generating choices for integer variables.
     *
     * @remarks
     * Steps between choices for integer variables are never smaller than the specified value.
     *
     * The parameter takes an integer value in range `1..1073741823`.
     *
     * The default value is `1073741823`.
     *
     * @category Failure-Directed Search
     */
    fdsMinIntVarChoiceStep?: number;
    /**
     * Influence of event time to initial choice rating
     *
     * @remarks
     * When non-zero, the initial choice rating is influenced by the date of the choice.
     * This way, very first choices in the search should be taken chronologically.
     *
     * The parameter takes a floating point value in range `0..1`.
     *
     * The default value is `0`.
     *
     * @category Failure-Directed Search
     */
    fdsEventTimeInfluence?: number;
    /**
     * How much to improve rating when both branches fail immediately
     *
     * @remarks
     * This parameter sets a bonus reward for a choice when both left and right branches fail immediately.
     * Current rating of both branches is multiplied by the specified value.
     *
     * The parameter takes a floating point value in range `0..1`.
     *
     * The default value is `0.98`.
     *
     * @category Failure-Directed Search
     */
    fdsBothFailRewardFactor?: number;
    /**
     * How often to chose a choice randomly
     *
     * @remarks
     * Probability that a choice is taken randomly. A randomly selected choice is not added to the search tree automatically. Instead, the choice is tried, its rating is updated,
     * but it is added to the search tree only if one of the branches fails.
     * The mechanism is similar to strong branching.
     *
     * The parameter takes a floating point value in range `0.0..0.99999`.
     *
     * The default value is `0.1`.
     *
     * @category Failure-Directed Search
     */
    fdsEpsilon?: number;
    /**
     * Number of choices to try in strong branching
     *
     * @remarks
     * Strong branching means that instead of taking a choice with the best rating,
     * we take the specified number (FDSStrongBranchingSize) of best choices,
     * try them in dry-run mode, measure their local rating, and
     * then chose the one with the best local rating.
     *
     * The parameter takes an integer value.
     *
     * The default value is `10`.
     *
     * @category Failure-Directed Search
     */
    fdsStrongBranchingSize?: number;
    /**
     * Up-to what search depth apply strong branching
     *
     * @remarks
     * Strong branching is typically used in the root node. This parameter controls
     * the maximum search depth when strong branching is used.
     *
     * The parameter takes an integer value.
     *
     * The default value is `6`.
     *
     * @category Failure-Directed Search
     */
    fdsStrongBranchingDepth?: number;
    /**
     * How to choose the best choice in strong branching
     *
     * @remarks
     * Possible values are:
     *
     * * `Both`: Choose the the choice with best combined rating.
     * * `Left` (the default): Choose the choice with the best rating of the left branch.
     * * `Right`: Choose the choice with the best rating of the right branch.
     *
     * The default value is `Left`.
     *
     * @category Failure-Directed Search
     */
    fdsStrongBranchingCriterion?: "Both" | "Left" | "Right";
    /**
     * Fail limit for the first restart
     *
     * @remarks
     * Failure-directed search is periodically restarted: explored part of the current search tree is turned into a no-good constraint, and the search starts again in the root node.
     * This parameter specifies the size of the very first search tree (measured in number of failures).
     *
     * The parameter takes an integer value in range `1..9223372036854775807`.
     *
     * The default value is `100`.
     *
     * @category Failure-Directed Search
     */
    fdsInitialRestartLimit?: number;
    /**
     * Restart strategy to use
     *
     * @remarks
     * This parameter specifies how the restart limit (maximum number of failures) changes from restart to restart.
     * Possible values are:
     *
     * * `Geometric` (the default): After each restart, restart limit is multiplied by {@link Parameters.fdsRestartGrowthFactor}.
     * * `Nested`: Similar to `Geometric` but the limit is changed back to {@link Parameters.fdsInitialRestartLimit} each time a new maximum limit is reached.
     * * `Luby`: Luby restart strategy is used. Parameter {@link Parameters.fdsRestartGrowthFactor} is ignored.
     *
     * The default value is `Geometric`.
     *
     * @category Failure-Directed Search
     */
    fdsRestartStrategy?: "Geometric" | "Nested" | "Luby";
    /**
     * Growth factor for fail limit after each restart
     *
     * @remarks
     * After each restart, the fail limit for the restart is multiplied by the specified factor.
     * This parameter is ignored when {@link Parameters.fdsRestartStrategy} is `Luby`.
     *
     * The parameter takes a floating point value in range `1.0..Infinity`.
     *
     * The default value is `1.15`.
     *
     * @category Failure-Directed Search
     */
    fdsRestartGrowthFactor?: number;
    /**
     * Truncate choice use counts after a restart to this value
     *
     * @remarks
     * The idea is that ratings learned in the previous restart are less valid in the new restart.
     * Using this parameter, it is possible to truncate use counts on choices so that new local ratings will have bigger weights (when FDSFixedAlpha is not used).
     *
     * The parameter takes an integer value.
     *
     * The default value is `255`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxCounterAfterRestart?: number;
    /**
     * Truncate choice use counts after a solution is found
     *
     * @remarks
     * Similar to {@link Parameters.fdsMaxCounterAfterRestart}, this parameter allows truncating use counts on choices when a solution is found.
     *
     * The parameter takes an integer value.
     *
     * The default value is `255`.
     *
     * @category Failure-Directed Search
     */
    fdsMaxCounterAfterSolution?: number;
    /**
     * Reset restart size after a solution is found (ignored in Luby)
     *
     * @remarks
     * When this parameter is set (the default), then restart limit is set back to {@link Parameters.fdsInitialRestartLimit} when a solution is found.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsResetRestartsAfterSolution?: boolean;
    /**
     * Whether to use or not nogood constraints
     *
     * @remarks
     * By default, no-good constraint is generated after each restart. This parameter allows to turn no-good constraints off.
     *
     * The default value is `True`.
     *
     * @category Failure-Directed Search
     */
    fdsUseNogoods?: boolean;
    /** @internal */
    _fdsFreezeRatingsAfterProof?: boolean;
    /** @internal */
    _fdsContinueAfterProof?: boolean;
    /** @internal */
    _fdsRepeatLimit?: number;
    /** @internal */
    _fdsCompletelyRandom?: boolean;
    /**
     * Whether to generate choices for objective expression/variable
     *
     * @remarks
     * This option controls the generation of choices on the objective. It works regardless of the objective is given by an expression or a variable.
     *
     * The default value is `False`.
     *
     * @category Failure-Directed Search
     */
    fdsBranchOnObjective?: boolean;
    /** @internal */
    _fdsImproveNogoods?: boolean;
    /**
     * Controls which side of a choice is explored first (considering the rating).
     *
     * @remarks
     * This option can take the following values:
     *
     * * `FailureFirst`: Explore the failure side first.
     * * `FailureLast`: Explore the failure side last.
     * * `Random`: Explore either side randomly.
     *
     * The default value is `FailureFirst`.
     *
     * @category Failure-Directed Search
     */
    fdsBranchOrdering?: "FailureFirst" | "FailureLast" | "Random";
    /** @internal */
    _fdsDiveBySetTimes?: boolean;
    /**
     * A strategy to choose objective cuts during FDSDual search.
     *
     * @remarks
     * Possible values are:
     *
     * * `Minimum`: Always change the cut by the minimum amount.
     * * `Random`: At each restart, randomly choose a value in range LB..UB. The default.
     * * `Split`: Always split the current range LB..UB in half.
     *
     * The default value is `Random`.
     *
     * @category Failure-Directed Search
     */
    fdsDualStrategy?: "Minimum" | "Random" | "Split";
    /**
     * Whether to reset ratings when a new LB is proved
     *
     * @remarks
     * When this parameter is on, and FDSDual proves a new lower bound, then all ratings are reset to default values.
     *
     * The default value is `False`.
     *
     * @category Failure-Directed Search
     */
    fdsDualResetRatings?: boolean;
    /** @internal */
    _lnsInitNoOverlapPropagationLevel?: number;
    /** @internal */
    _lnsInitCumulPropagationLevel?: number;
    /** @internal */
    _lnsFirstFailLimit?: number;
    /** @internal */
    _lnsFailLimitGrowthFactor?: number;
    /** @internal */
    _lnsFailLimitCoefficient?: number;
    /** @internal */
    _lnsIterationsAfterFirstSolution?: number;
    /** @internal */
    _lnsAggressiveDominance?: boolean;
    /** @internal */
    _lnsSameSolutionPeriod?: number;
    /** @internal */
    _lnsTier1Size?: number;
    /** @internal */
    _lnsTier2Size?: number;
    /** @internal */
    _lnsTier3Size?: number;
    /** @internal */
    _lnsTier2Effort?: number;
    /** @internal */
    _lnsTier3Effort?: number;
    /** @internal */
    _lnsStepFailLimitFactor?: number;
    /** @internal */
    _lnsApplyCutProbability?: number;
    /** @internal */
    _lnsSmallStructureLimit?: number;
    /** @internal */
    _lnsResourceOptimization?: boolean;
    /** @internal */
    _lnsRestoreAbsentIntervals?: boolean;
    /** @internal */
    _lnsRestoreIntervalLengths?: boolean;
    /** @internal */
    _lnsRestoreIntVarValues?: boolean;
    /**
     * Use only the user-provided warm start as the initial solution in LNS
     *
     * @remarks
     * When this parameter is on, the solver will use only the user-specified warm start solution for the initial solution phase in LNS. If no warm start is provided, the solver will search for its own initial solution as usual.
     *
     * The default value is `False`.
     *
     * @category Large Neighborhood Search
     */
    lnsUseWarmStartOnly?: boolean;
    /** @internal */
    _lnsHeuristicsEpsilon?: number;
    /** @internal */
    _lnsHeuristicsAlpha?: number;
    /** @internal */
    _lnsHeuristicsTemperature?: number;
    /** @internal */
    _lnsHeuristicsUniform?: boolean;
    /** @internal */
    _lnsHeuristicsInitialQ?: number;
    /** @internal */
    _lnsPortionEpsilon?: number;
    /** @internal */
    _lnsPortionAlpha?: number;
    /** @internal */
    _lnsPortionTemperature?: number;
    /** @internal */
    _lnsPortionUniform?: boolean;
    /** @internal */
    _lnsPortionInitialQ?: number;
    /** @internal */
    _lnsPortionHandicapLimit?: number;
    /** @internal */
    _lnsPortionHandicapValue?: number;
    /** @internal */
    _lnsPortionHandicapInitialQ?: number;
    /** @internal */
    _lnsNeighborhoodStrategy?: number;
    /** @internal */
    _lnsNeighborhoodEpsilon?: number;
    /** @internal */
    _lnsNeighborhoodAlpha?: number;
    /** @internal */
    _lnsNeighborhoodTemperature?: number;
    /** @internal */
    _lnsNeighborhoodUniform?: boolean;
    /** @internal */
    _lnsNeighborhoodInitialQ?: number;
    /** @internal */
    _lnsDivingLimit?: number;
    /** @internal */
    _lnsDivingFailLimitRatio?: number;
    /** @internal */
    _lnsLearningRun?: boolean;
    /** @internal */
    _lnsStayOnObjective?: boolean;
    /** @internal */
    _lnsFDS?: boolean;
    /** @internal */
    _lnsFreezeIntervalsBeforeFragment?: boolean;
    /** @internal */
    _lnsRelaxSlack?: number;
    /** @internal */
    _lnsPortionMultiplier?: number;
    /**
     * Which worker computes simple lower bound
     *
     * @remarks
     * Simple lower bound is a bound such that infeasibility of a better objective can be proved by propagation only (without the search). The given worker computes simple lower bound before it starts the normal search. If a worker with the given number doesn't exist, then the lower bound is not computed.
     *
     * The parameter takes an integer value in range `-1..2147483647`.
     *
     * The default value is `0`.
     *
     * @category Simple Lower Bound
     */
    simpleLBWorker?: number;
    /**
     * Maximum number of feasibility checks
     *
     * @remarks
     * Simple lower bound is computed by binary search for the best objective value that is not infeasible by propagation. This parameter limits the maximum number of iterations of the binary search. When the value is 0, then simple lower bound is not computed at all.
     *
     * The parameter takes an integer value in range `0..2147483647`.
     *
     * The default value is `2147483647`.
     *
     * @category Simple Lower Bound
     */
    simpleLBMaxIterations?: number;
    /**
     * Number of shaving rounds
     *
     * @remarks
     * When non-zero, the solver shaves on variable domains to improve the lower bound. This parameter controls the number of shaving rounds.
     *
     * The parameter takes an integer value in range `0..2147483647`.
     *
     * The default value is `0`.
     *
     * @category Simple Lower Bound
     */
    simpleLBShavingRounds?: number;
    /** @internal */
    _debugTraceLevel?: number;
    /** @internal */
    _memoryTraceLevel?: number;
    /** @internal */
    _propagationDetailTraceLevel?: number;
    /** @internal */
    _setTimesTraceLevel?: number;
    /** @internal */
    _communicationTraceLevel?: number;
    /** @internal */
    _presolveTraceLevel?: number;
    /** @internal */
    _conversionTraceLevel?: number;
    /** @internal */
    _expressionBuilderTraceLevel?: number;
    /** @internal */
    _memorizationTraceLevel?: number;
    /** @internal */
    _searchDetailTraceLevel?: number;
    /** @internal */
    _fdsTraceLevel?: number;
    /** @internal */
    _shavingTraceLevel?: number;
    /** @internal */
    _fdsRatingsTraceLevel?: number;
    /** @internal */
    _lnsTraceLevel?: number;
    /** @internal */
    _heuristicReplayTraceLevel?: number;
    /** @internal */
    _allowSetTimesProofs?: boolean;
    /** @internal */
    _setTimesAggressiveDominance?: boolean;
    /** @internal */
    _setTimesExtendsCoef?: number;
    /** @internal */
    _setTimesHeightStrategy?: "FromMax" | "FromMin" | "Random";
    /** @internal */
    _setTimesItvMappingStrategy?: "FromMax" | "FromMin" | "Random";
    /** @internal */
    _setTimesInitDensity?: number;
    /** @internal */
    _setTimesDensityLength?: number;
    /** @internal */
    _setTimesDensityReliabilityThreshold?: number;
    /** @internal */
    _setTimesNbExtendsFactor?: number;
    /** @internal */
    _discreteLowCapacityLimit?: number;
    /** @internal */
    _lnsTrainingObjectiveLimit?: number;
    /** @internal */
    _posAbsentRelated?: boolean;
    /** @internal */
    _defaultCallbackBlockSize?: number;
    /** @internal */
    _useReservoirPegging?: boolean;
    /** @internal */
    _useTimeNet?: boolean;
    /** @internal */
    _timeNetVarsToPreprocess?: number;
    /** @internal */
    _timeNetSubPriorityBits?: number;
};
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
export declare function copyParameters(params: Parameters): Parameters;
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
export declare function mergeParameters(base: Parameters, overrides: Parameters): Parameters;
/** @internal @deprecated Use function mergeParameters instead. */
export declare function combineParameters(base: Parameters, overrides: Parameters): Parameters;
/** @internal (could be made public later) */
export type IntervalVarValue = null | {
    start: number;
    end: number;
};
/** @internal */
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
 * @remarks
 * An event emitted by {@link Solver} when a solution is found.
 *
 * The event can be intercepted by setting the {@link Solver.onSolution} callback.
 * The event contains the solution, solving time so far, and the result of
 * solution verification.
 *
 * @see {@link Solver}.
 * @see {@link Solver.onSolution} to register a solution callback.
 *
 * @category Solving
 */
export type SolutionEvent = {
    /**
     * The duration of the solve at the time the solution was found, in seconds.
     *
     * @category Solving
     */
    solveTime: number;
    /**
     * Result of the verification of the solution.
     *
     * @remarks
     * When parameter {@link Parameters.verifySolutions} is set to `True` (the
     * default), the solver verifies all solutions found. The
     * verification checks that all constraints in the model are satisfied and
     * that the objective value is computed correctly.
     *
     * The verification is done using a separate code (not used during the
     * search). The point is to independently verify the correctness of the
     * solution.
     *
     * Possible values are:
     *
     * * `None` - the solution was not verified (because the parameter
     *   {@link Parameters.verifySolutions} was not set).
     * * `True` - the solution was verified and correct.
     *
     * The value can never be `False` because, in that case, the solver ends with an
     * error.
     *
     * @category Solving
     */
    valid?: true | undefined;
    /**
     * The solution containing values for all variables and the objective value.
     *
     * @remarks
     * The solution contains values of all variables in the model (including
     * optional variables) and the value of the objective (if the model specified
     * one).
     *
     * @see {@link Solution} for accessing variable values.
     *
     * @category Solving
     */
    solution: Solution;
};
/**
 * Single entry in the objective bound history.
 *
 * @remarks
 * Tracks when a new (better) bound on the objective was proved, along with
 * the solve time and bound value. For minimization problems, this is the
 * lower bound; for maximization, the upper bound.
 *
 * @see {@link SolveResult.objectiveBoundHistory} for accessing the history.
 *
 * @category Solving
 */
export type ObjectiveBoundEntry = {
    /**
     * Duration of the solve at the time the bound was found, in seconds.
     *
     * @returns Seconds elapsed.
     */
    solveTime: number;
    /**
     * The new bound value.
     *
     * @returns Bound value.
     *
     * @remarks
     * For minimization problems, this is a lower bound on the objective.
     * For maximization problems, this is an upper bound on the objective.
     */
    value: ObjectiveValue;
};
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
export declare class Solution {
    #private;
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
    constructor();
    /** @internal (read from a message sent by the solver) */
    _init(msg: SerializedSolution): void;
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
    getObjective(): ObjectiveValue;
    /**
     * Returns `true` if the given variable is present in the solution.
     *
     * @param variable The variable to check
     *
     * @returns True if the variable is present
     *
     * @remarks
     * In the preview version of OptalCP, this method always returns `false`
     * because real values of variables are masked and replaced by value *absent*.
     */
    isPresent(variable: IntervalVar | IntVar | BoolVar): boolean;
    /** @internal */
    isPresent(variable: FloatVar): boolean;
    /**
     * Returns `true` if the given variable is absent in the solution.
     *
     * @param variable The variable to check
     *
     * @returns True if the variable is absent
     *
     * @remarks
     * In the preview version of OptalCP, this method always returns `true`
     * because real values of variables are masked and replaced by value *absent*.
     */
    isAbsent(variable: IntervalVar | IntVar | BoolVar): boolean;
    /** @internal */
    isAbsent(variable: FloatVar): boolean;
    /**
     * Gets an integer variable's value from the solution.
     *
     * @param variable The integer variable to get the value of
     *
     * @returns The value, or None if the variable is absent
     */
    getValue(variable: IntVar): number | null;
    /**
     * Gets a boolean variable's value from the solution.
     *
     * @param variable The boolean variable to get the value of
     *
     * @returns The value, or None if the variable is absent
     */
    getValue(variable: BoolVar): boolean | null;
    /** @internal */
    getValue(variable: FloatVar): number | null;
    /**
     * Gets an interval variable's start and end from the solution.
     *
     * @param variable The interval variable to get the value of
     *
     * @returns An object with start and end properties, or null if the interval is absent
     */
    getValue(variable: IntervalVar): {
        start: number;
        end: number;
    } | null;
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
    getStart(variable: IntervalVar): number | null;
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
    getEnd(variable: IntervalVar): number | null;
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
    getLength(variable: IntervalVar): number | null;
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
    setObjective(value: ObjectiveValue): void;
    /** @internal */
    setAbsent(variable: FloatVar): void;
    /**
     * Sets the given variable to be absent in the solution.
     *
     * @param variable The variable to set as absent
     *
     * @remarks
     * This function can be used for construction of an external solution that can be
     * passed to the solver (see {@link Model.solve} and {@link Solver.sendSolution}).
     */
    setAbsent(variable: IntervalVar | IntVar | BoolVar): void;
    /**
     * Sets the value of the given boolean variable in the solution.
     *
     * @param variable The boolean variable
     * @param value The value to set (True or False)
     *
     * @remarks
     * The variable will be present in the solution with the given value.
     *
     * @see {@link Solution.setAbsent} to make the variable absent.
     */
    setValue(variable: BoolVar, value: boolean): void;
    /**
     * Sets the value of the given integer variable in the solution.
     *
     * @param variable The integer variable
     * @param value The value to set
     *
     * @remarks
     * The variable will be present in the solution with the given value.
     *
     * @see {@link Solution.setAbsent} to make the variable absent.
     */
    setValue(variable: IntVar, value: number): void;
    /** @internal */
    setValue(variable: FloatVar, value: number): void;
    /**
     * Sets the start and end of the given interval variable in the solution.
     *
     * @param variable The interval variable
     * @param start The start time
     * @param end The end time
     *
     * @remarks
     * The interval variable will be present in the solution with the given start and end.
     *
     * @see {@link Solution.setAbsent} to make the variable absent.
     */
    setValue(variable: IntervalVar, start: number, end: number): void;
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
    /** Number of integer variables in the input model. */
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
export declare class Model {
    #private;
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
     * @param arg The boolean expression to negate.
     *
     * @returns The resulting Boolean expression
     *
     * @remarks
     * If the argument has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link BoolExpr.not}.
     */
    not(arg: BoolExpr | boolean): BoolExpr;
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
    or(lhs: BoolExpr | boolean, rhs: BoolExpr | boolean): BoolExpr;
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
    and(lhs: BoolExpr | boolean, rhs: BoolExpr | boolean): BoolExpr;
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
    implies(lhs: BoolExpr | boolean, rhs: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _eq(lhs: BoolExpr | boolean, rhs: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _ne(lhs: BoolExpr | boolean, rhs: BoolExpr | boolean): BoolExpr;
    /** @internal */
    _nand(lhs: BoolExpr | boolean, rhs: BoolExpr | boolean): BoolExpr;
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
    guard(arg: IntExpr | number, absentValue?: number): IntExpr;
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
    times(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
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
    div(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
    /** @internal */
    _modulo(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
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
    identity(lhs: IntExpr | number, rhs: IntExpr | number): Constraint;
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
    eq(lhs: IntExpr | number, rhs: IntExpr | number): BoolExpr;
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
    ne(lhs: IntExpr | number, rhs: IntExpr | number): BoolExpr;
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
    lt(lhs: IntExpr | number, rhs: IntExpr | number): BoolExpr;
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
    gt(lhs: IntExpr | number, rhs: IntExpr | number): BoolExpr;
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
    inRange(arg: IntExpr | number, lb: number, ub: number): BoolExpr;
    /** @internal */
    _notInRange(arg: IntExpr | number, lb: number, ub: number): BoolExpr;
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
    abs(arg: IntExpr | number): IntExpr;
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
    min2(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
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
    max2(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
    /** @internal */
    _square(arg: IntExpr | number): IntExpr;
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
    max(args: (IntExpr | number)[]): IntExpr;
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
    _floatIdentity(lhs: FloatExpr | number, rhs: FloatExpr | number): Constraint;
    /** @internal */
    _floatGuard(arg: FloatExpr | number, absentValue?: number): FloatExpr;
    /** @internal */
    _floatNeg(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatPlus(lhs: FloatExpr | number, rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMinus(lhs: FloatExpr | number, rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatTimes(lhs: FloatExpr | number, rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatDiv(lhs: FloatExpr | number, rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatEq(lhs: FloatExpr | number, rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatNe(lhs: FloatExpr | number, rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLt(lhs: FloatExpr | number, rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatLe(lhs: FloatExpr | number, rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGt(lhs: FloatExpr | number, rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatGe(lhs: FloatExpr | number, rhs: FloatExpr | number): BoolExpr;
    /** @internal */
    _floatInRange(arg: FloatExpr | number, lb: number, ub: number): BoolExpr;
    /** @internal */
    _floatNotInRange(arg: FloatExpr | number, lb: number, ub: number): BoolExpr;
    /** @internal */
    _floatAbs(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatSquare(arg: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMin2(lhs: FloatExpr | number, rhs: FloatExpr | number): FloatExpr;
    /** @internal */
    _floatMax2(lhs: FloatExpr | number, rhs: FloatExpr | number): FloatExpr;
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
    lexLe(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): Constraint;
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
    lexLt(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): Constraint;
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
    lexGe(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): Constraint;
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
    lexGt(lhs: (IntExpr | number)[], rhs: (IntExpr | number)[]): Constraint;
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
    start(interval: IntervalVar): IntExpr;
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
    end(interval: IntervalVar): IntExpr;
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
    length(interval: IntervalVar): IntExpr;
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
    startOr(interval: IntervalVar, absentValue: number): IntExpr;
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
    endOr(interval: IntervalVar, absentValue: number): IntExpr;
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
    lengthOr(interval: IntervalVar, absentValue: number): IntExpr;
    /** @internal */
    _overlapLength(interval1: IntervalVar, interval2: IntervalVar): IntExpr;
    /** @internal */
    _alternativeCost(main: IntervalVar, options: IntervalVar[], weights: number[]): IntExpr;
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
    endBeforeEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    endBeforeStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startBeforeEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startBeforeStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    endAtEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    endAtStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startAtEnd(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    startAtStart(predecessor: IntervalVar, successor: IntervalVar, delay?: IntExpr | number): Constraint;
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
    alternative(main: IntervalVar, options: IntervalVar[]): Constraint;
    /** @internal */
    _intervalVarElement(slots: IntervalVar[], index: IntExpr | number, value: IntervalVar): Constraint;
    /** @internal */
    _increasingIntervalVarElement(slots: IntervalVar[], index: IntExpr | number, value: IntervalVar): Constraint;
    /** @internal */
    _itvMapping(tasks: IntervalVar[], slots: IntervalVar[], indices: (IntExpr | number)[]): Constraint;
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
    span(main: IntervalVar, covered: IntervalVar[]): Constraint;
    /** @internal */
    _noOverlap(sequence: SequenceVar, transitions?: number[][]): Constraint;
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
    position(interval: IntervalVar, sequence: SequenceVar): IntExpr;
    /** @internal */
    _sameSequence(sequence1: SequenceVar, sequence2: SequenceVar): Constraint;
    /** @internal */
    _sameSequenceGroup(sequences: SequenceVar[]): Constraint;
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
    pulse(interval: IntervalVar, height: IntExpr | number): CumulExpr;
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
    stepAtStart(interval: IntervalVar, height: IntExpr | number): CumulExpr;
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
    stepAtEnd(interval: IntervalVar, height: IntExpr | number): CumulExpr;
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
    stepAt(x: number, height: IntExpr | number): CumulExpr;
    /** @internal */
    _cumulMaxProfile(cumul: CumulExpr, profile: IntStepFunction): Constraint;
    /** @internal */
    _cumulMinProfile(cumul: CumulExpr, profile: IntStepFunction): Constraint;
    /** @internal */
    _cumulStairs(atoms: CumulExpr[]): CumulExpr;
    /** @internal */
    _precedenceEnergyBefore(main: IntervalVar, others: IntervalVar[], heights: number[], capacity: number): Constraint;
    /** @internal */
    _precedenceEnergyAfter(main: IntervalVar, others: IntervalVar[], heights: number[], capacity: number): Constraint;
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
    integral(func: IntStepFunction, interval: IntervalVar): IntExpr;
    /** @internal */
    _stepFunctionIntegralInRange(func: IntStepFunction, interval: IntervalVar, lb: number, ub: number): Constraint;
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
    eval(func: IntStepFunction, arg: IntExpr | number): IntExpr;
    /** @internal */
    _stepFunctionEvalInRange(func: IntStepFunction, arg: IntExpr | number, lb: number, ub: number): Constraint;
    /** @internal */
    _stepFunctionEvalNotInRange(func: IntStepFunction, arg: IntExpr | number, lb: number, ub: number): Constraint;
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
    forbidExtent(interval: IntervalVar, func: IntStepFunction): Constraint;
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
    forbidStart(interval: IntervalVar, func: IntStepFunction): Constraint;
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
    forbidEnd(interval: IntervalVar, func: IntStepFunction): Constraint;
    /** @internal */
    _disjunctiveIsBefore(x: IntervalVar, y: IntervalVar): BoolExpr;
    /** @internal */
    _itvPresenceChain(intervals: IntervalVar[]): Constraint;
    /** @internal */
    _itvPresenceChainWithCount(intervals: IntervalVar[], count: IntExpr | number): Constraint;
    /** @internal */
    _endBeforeStartChain(intervals: IntervalVar[]): Constraint;
    /** @internal */
    _startBeforeStartChain(intervals: IntervalVar[]): Constraint;
    /** @internal */
    _endBeforeEndChain(intervals: IntervalVar[]): Constraint;
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
    _decisionPresentLengthLE(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _decisionOptionalLengthGT(variable: IntervalVar, bound: number, isLeft: boolean): SearchDecision;
    /** @internal */
    _noGood(decisions: SearchDecision[]): Constraint;
    /** @internal */
    _related(x: IntervalVar, y: IntervalVar): Directive;
    /** @internal */
    _pack(load: (IntExpr | number)[], where: (IntExpr | number)[], sizes: number[]): Constraint;
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
    noOverlap(intervals: Array<IntervalVar> | SequenceVar, transitions?: number[][]): void;
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
    get name(): string | undefined;
    set name(value: string);
    /** @internal @deprecated Use `name` property instead */
    setName(name: string): void;
    /** @internal @deprecated Use `name` property instead */
    getName(): string | undefined;
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
    enforce(constraint: Constraint | BoolExpr | boolean | Iterable<Constraint | BoolExpr | boolean>): void;
    /** @internal @deprecated Use `enforce` instead */
    constraint(constraint: Constraint | BoolExpr | boolean): void;
    /** @internal */
    _addDirective(directive: Directive): void;
    /** @internal */
    _addConstraint(constraint: Constraint): void;
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
    boolVar(params?: {
        optional?: boolean;
        name?: string;
    }): BoolVar;
    /** @internal */
    auxiliaryBoolVar({ range, optional, name }: {
        range?: [boolean?, boolean?] | boolean;
        optional?: boolean;
        name?: string;
    }): BoolVar;
    /**@internal */
    auxiliaryBoolVar(name?: string): BoolVar;
    /**
     * Creates a new integer variable and adds it to the model.
     *
     * @param params.min Minimum value of the variable (default 0)
     * @param params.max Maximum value of the variable (default {@link IntVarMax})
     * @param params.optional Whether the variable is optional (default false)
     * @param params.name Name of the variable for debugging and display
     *
     * @returns The created integer variable.
     *
     * @remarks
     * An integer variable represents an unknown value the solver must find.
     * The variable can be optional.
     * In this case, its value in a solution could be *absent*, meaning that the solution does not use the variable at all.
     *
     * @example
     * ```ts
     * let model = new CP.Model();
     *
     * // Create a present integer variable with possible values 1..10:
     * let x = model.intVar({ min: 1, max: 10, name: "x" });
     *
     * // Create an optional integer variable with possible values 5..IntVarMax:
     * let y = model.intVar({ min: 5, optional: true, name: "y" });
     *
     * // Create an integer variable with a fixed value 10 (optional):
     * let z = model.intVar({ min: 10, max: 10, optional: true, name: "z" });
     * ```
     */
    intVar(params?: {
        min?: number;
        max?: number;
        optional?: boolean;
        name?: string;
    }): IntVar;
    /** @internal @deprecated */
    intVar(params: {
        range?: [number?, number?] | number;
        optional?: boolean;
        name?: string;
    }): IntVar;
    /** @internal */
    auxiliaryIntVar(params: {
        range?: [number?, number?] | number;
        optional?: boolean;
        name?: string;
    }): IntVar;
    /** @internal */
    floatVar(params?: {
        min?: number;
        max?: number;
        optional?: boolean;
        name?: string;
    }): FloatVar;
    /** @internal */
    auxiliaryFloatVar(params: {
        min?: number;
        max?: number;
        optional?: boolean;
        name?: string;
    }): FloatVar;
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
    intervalVar(params?: {
        start?: number | [number?, number?];
        end?: number | [number?, number?];
        length?: number | [number?, number?];
        optional?: boolean;
        name?: string;
    }): IntervalVar;
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
    sequenceVar(intervals: IntervalVar[], types?: number[], name?: string): SequenceVar;
    /** @internal */
    auxiliarySequenceVar(intervals: IntervalVar[], types?: number[]): SequenceVar;
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
    presence(arg: IntExpr | number | boolean | IntervalVar): BoolExpr;
    /**
     * Creates an integer expression for the sum of the arguments.
     *
     * @param args Array of integer expressions to sum.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * Absent arguments are ignored (treated as zeros). Therefore, the resulting expression is never *absent*.
     *
     * Note that binary function {@link Model.plus} handles absent values differently. For example, when `x` is *absent* then:
     *
     * * `plus(x, 3)` is *absent*.
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
     * let result = await model.solve({ searchType: "FDS" });
     * ```
     */
    sum(args: Array<IntExpr | number>): IntExpr;
    /**
     * Sum of cumulative expressions.
     *
     * @param args Array of cumulative expressions to sum.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Computes the sum of cumulative functions. The sum can be used, e.g., to combine contributions of individual tasks to total resource consumption.
     *
     * **Limitation:** Currently, pulse-based and step-based cumulative expressions cannot be mixed. All expressions in the sum must be either pulse-based or step-based.
     */
    sum(args: Array<CumulExpr>): CumulExpr;
    /**
     * Creates an addition of the two integer expressions, i.e. `lhs + rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link IntExpr.plus}.
     */
    plus(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
    /**
     * Addition of two cumulative expressions.
     *
     * @param lhs The left-hand side cumulative expression.
     * @param rhs The right-hand side cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Computes addition of two cumulative functions.
     *
     * ### Formal definition
     *
     * Let `result = plus(lhs, rhs)`. Then for any number `x` in range {@link IntervalMin}..{@link IntervalMax} the value of `result` at `x` is equal to `lhs` at `x` plus `rhs` at `x`.
     *
     * `plus(lhs, rhs)` is the same as `sum([lhs, rhs])`.
     *
     * @see {@link CumulExpr.plus} for the equivalent function on {@link CumulExpr}.
     * @see {@link Model.sum}, {@link Model.minus}, {@link Model.neg} for other ways to combine cumulative functions.
     */
    plus(lhs: CumulExpr, rhs: CumulExpr): CumulExpr;
    /**
     * Creates a subtraction of the two integer expressions, i.e. `lhs - rhs`.
     *
     * @param lhs The first integer expression.
     * @param rhs The second integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If one of the arguments has value *absent*, then the resulting expression also has value *absent*.
     *
     * Same as {@link IntExpr.minus}.
     */
    minus(lhs: IntExpr | number, rhs: IntExpr | number): IntExpr;
    /**
     * Subtraction of two cumulative expressions.
     *
     * @param lhs The left-hand side cumulative expression.
     * @param rhs The right-hand side cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Computes subtraction of two cumulative functions.
     *
     * ### Formal definition
     *
     * Let `result = minus(lhs, rhs)`. Then for any number `x` in range {@link IntervalMin}..{@link IntervalMax} the value of `result` at `x` is equal to `lhs` at `x` minus `rhs` at `x`.
     *
     * `minus(lhs, rhs)` is the same as `sum([lhs, neg(rhs)])`.
     *
     * @see {@link CumulExpr.minus} for the equivalent function on {@link CumulExpr}.
     * @see {@link Model.sum}, {@link Model.plus}, {@link Model.neg} for other ways to combine cumulative functions.
     */
    minus(lhs: CumulExpr, rhs: CumulExpr): CumulExpr;
    /**
     * Creates Boolean expression `lhs` &le; `rhs`.
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
     * Same as {@link IntExpr.le}.
     */
    le(lhs: IntExpr | number, rhs: IntExpr | number): BoolExpr;
    /**
     * Constrains cumulative function `cumul` to be everywhere less or equal to `maxCapacity`.
     *
     * @param cumul The cumulative expression.
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
     * @see {@link CumulExpr.le} for the equivalent function on {@link CumulExpr}.
     * @see {@link Model.ge} for the opposite constraint.
     */
    le(cumul: CumulExpr, maxCapacity: IntExpr | number): Constraint;
    /**
     * Creates Boolean expression `lhs` &ge; `rhs`.
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
     * Same as {@link IntExpr.ge}.
     */
    ge(lhs: IntExpr | number, rhs: IntExpr | number): BoolExpr;
    /**
     * Constrains cumulative function `cumul` to be everywhere greater or equal to `minCapacity`.
     *
     * @param cumul The cumulative expression.
     * @param minCapacity The minimum capacity value.
     *
     * @returns The constraint object
     *
     * @remarks
     * This function can be used to specify the minimum limit of resource usage at any time. For example to make sure that there is never less than zero material on stock.
     * See {@link Model.stepAtStart} for an example with `ge`.
     *
     * @see {@link CumulExpr.ge} for the equivalent function on {@link CumulExpr}.
     * @see {@link Model.le} for the opposite constraint.
     */
    ge(cumul: CumulExpr, minCapacity: number): Constraint;
    /**
     * Constrains cumulative function to be at most `maxCapacity` (reversed parameter order).
     *
     * @param maxCapacity The maximum capacity value, which can be a constant or an expression.
     * @param cumul The cumulative expression.
     *
     * @returns The constraint object
     *
     * @remarks
     * Reversed parameter order for `model.ge(capacity, cumul)`. Equivalent to `model.le(cumul, capacity)`.
     *
     * This allows writing `capacity >= cumul` in a natural order.
     *
     * @see {@link Model.le} for the standard parameter order.
     * @see {@link CumulExpr.le} for the fluent API.
     */
    ge(maxCapacity: IntExpr | number, cumul: CumulExpr): Constraint;
    /**
     * Creates negation of the integer expression, i.e. `-arg`.
     *
     * @param arg The integer expression.
     *
     * @returns The resulting integer expression
     *
     * @remarks
     * If the value of `arg` has value *absent* then the resulting expression has also value *absent*.
     *
     * Same as {@link IntExpr.neg}.
     */
    neg(arg: IntExpr | number): IntExpr;
    /**
     * Negation of a cumulative expression.
     *
     * @param arg The cumulative expression.
     *
     * @returns The resulting cumulative expression
     *
     * @remarks
     * Computes negation of a cumulative function. That is, the resulting function has the opposite values.
     *
     * @see {@link CumulExpr.neg} for the equivalent function on {@link CumulExpr}.
     *
     * @see {@link Model.sum}, {@link Model.plus}, {@link Model.minus} for other ways to combine cumulative functions.
     */
    neg(arg: CumulExpr): CumulExpr;
    /** @internal @deprecated Use `Model.presence` instead. */
    presenceOf(arg: IntExpr | number | boolean | IntervalVar): BoolExpr;
    /** @internal @deprecated Use `Model.start` isntead. */
    startOf(interval: IntervalVar): IntExpr;
    /** @internal @deprecated Use `Model.end` instead. */
    endOf(interval: IntervalVar): IntExpr;
    /** @internal @deprecated Use `Model.length` instead. */
    lengthOf(interval: IntervalVar): IntExpr;
    /** @internal @deprecated Use `Model.sum` instead. */
    cumulSum(args: Array<CumulExpr>): CumulExpr;
    /** @internal @deprecated Use `Model.plus` instead. */
    cumulPlus(lhs: CumulExpr, rhs: CumulExpr): CumulExpr;
    /** @internal @deprecated Use `Model.minus` instead. */
    cumulMinus(lhs: CumulExpr, rhs: CumulExpr): CumulExpr;
    /** @internal @deprecated Use `Model.le` instead. */
    cumulLe(cumul: CumulExpr, maxCapacity: IntExpr | number): Constraint;
    /** @internal @deprecated Use `Model.ge` instead. */
    cumulGe(cumul: CumulExpr, minCapacity: number): Constraint;
    /** @internal @deprecated Use `CumulExpr.neg` instead. */
    cumulNeg(arg: CumulExpr): CumulExpr;
    /** @internal @deprecated Use `Model.integral` instead. */
    stepFunctionSum(func: IntStepFunction, interval: IntervalVar): IntExpr;
    /** @internal @deprecated Use `Model.eval` instead. */
    stepFunctionEval(func: IntStepFunction, x: IntExpr): IntExpr;
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
    minimize(expr: IntExpr | number): Objective;
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
    maximize(expr: IntExpr | number): Objective;
    /** @internal */
    _minimizeConsecutively(arg: IntExpr[]): void;
    /** @internal */
    _maximizeConsecutively(arg: IntExpr[]): void;
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
    stepFunction(values: number[][]): IntStepFunction;
    /** @internal */
    getPrimaryObjectiveExpression(): IntExpr | number | undefined;
    /** @internal */
    _toObject(params?: Parameters, warmStart?: Solution): {
        refs: ElementProps[];
        model: Argument[];
        name: string | undefined;
        objective: ElementProps | undefined;
        parameters: Partial<Parameters>;
        warmStart: SerializedSolution | undefined;
    };
    /** @internal */
    _serialize(command: string, params: Parameters, warmStart?: Solution, batchResults?: boolean): string;
    /** @internal */
    _fromObject(data: SerializedModelData): void;
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
    _getNewRefId(node: ElementProps): number;
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
    getIntervalVars(): Array<IntervalVar>;
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
    getBoolVars(): Array<BoolVar>;
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
    getIntVars(): Array<IntVar>;
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
    solve(parameters?: Parameters, warmStart?: Solution): Promise<SolveResult>;
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
    toJSON(parameters?: Parameters, warmStart?: Solution): string;
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
    static fromJSON(jsonStr: string): {
        model: Model;
        parameters?: Parameters;
        warmStart?: Solution;
    };
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
    toJS(parameters?: Parameters, warmStart?: Solution): Promise<string | undefined>;
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
    toText(parameters?: Parameters, warmStart?: Solution): Promise<string | undefined>;
}
/**
 * @internal
 * A command for the solver. Used by Solver.setCommand.
 */
export type SolverCommand = "solve" | "propagate" | "toText" | "toJS";
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
export declare class Solver {
    #private;
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
    get onSolution(): ((event: SolutionEvent) => void) | ((event: SolutionEvent) => Promise<void>) | undefined;
    set onSolution(handler: ((event: SolutionEvent) => void) | ((event: SolutionEvent) => Promise<void>) | undefined);
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
    get onObjectiveBound(): ((event: ObjectiveBoundEntry) => void) | ((event: ObjectiveBoundEntry) => Promise<void>) | undefined;
    set onObjectiveBound(handler: ((event: ObjectiveBoundEntry) => void) | ((event: ObjectiveBoundEntry) => Promise<void>) | undefined);
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
    get onSummary(): ((summary: SolveSummary) => void) | ((summary: SolveSummary) => Promise<void>) | undefined;
    set onSummary(handler: ((summary: SolveSummary) => void) | ((summary: SolveSummary) => Promise<void>) | undefined);
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
    get onLog(): ((msg: string) => void) | ((msg: string) => Promise<void>) | undefined;
    set onLog(handler: ((msg: string) => void) | ((msg: string) => Promise<void>) | undefined);
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
    get onWarning(): ((msg: string) => void) | ((msg: string) => Promise<void>) | undefined;
    set onWarning(handler: ((msg: string) => void) | ((msg: string) => Promise<void>) | undefined);
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
    get onError(): ((msg: string) => void) | ((msg: string) => Promise<void>) | undefined;
    set onError(handler: ((msg: string) => void) | ((msg: string) => Promise<void>) | undefined);
    /** @internal */
    _onStart?: () => void;
    /** @internal */
    _onClose?: () => void;
    /** @internal */
    _onDomains?: (msg: DomainsEvent) => void;
    /** @internal */
    _onTextModel?: (msg: string) => void;
    /** @internal @deprecated Use `solver.onError = ...` instead. */
    on(event: 'error', listener: (msg: string) => void): this;
    /** @internal @deprecated Use `solver.onWarning = ...` instead. */
    on(event: 'warning', listener: (msg: string) => void): this;
    /** @internal @deprecated Use `solver.onLog = ...` instead. */
    on(event: 'log', listener: (msg: string) => void): this;
    /** @internal @deprecated Use `solver.onSolution = ...` instead. */
    on(event: 'solution', listener: (msg: SolutionEvent) => void): this;
    /** @internal @deprecated Use `solver.onObjectiveBound = ...` instead. */
    on(event: 'objectiveBound', listener: (msg: ObjectiveBoundEntry) => void): this;
    /** @internal @deprecated Use `solver.onObjectiveBound = ...` instead. */
    on(event: 'lowerBound', listener: (msg: ObjectiveBoundEntry) => void): this;
    /** @internal @deprecated Use `solver.onSummary = ...` instead. */
    on(event: 'summary', listener: (msg: SolveSummary) => void): this;
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
    solve(model: Model, params?: Parameters, warmStart?: Solution): Promise<SolveResult>;
    /** @internal */
    _run(command: SolverCommand, model: Model, params?: Parameters, warmStart?: Solution): Promise<void>;
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
    stop(reason: string): Promise<void>;
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
    sendSolution(solution: Solution): Promise<void>;
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
    /**
     * Resets process state fields after solver connection closes.
     * Called automatically when the connection is closed.
     * @internal
     */
    _resetProcessState(): void;
    /**
     * Resets process and result state fields to allow Solver reuse.
     * @internal
     */
    _resetState(): void;
}
/**
 * Single entry in the objective value history.
 *
 * @remarks
 * Tracks when each improving solution was found during the solve, along with
 * its objective value and validation status.
 *
 * There is one entry for each solution found. The entries are ordered by
 * solve time.
 *
 * @see {@link SolveResult.objectiveHistory} for accessing the history.
 *
 * @category Solving
 */
export type ObjectiveEntry = {
    /**
     * Duration of the solve when this solution was found, in seconds.
     *
     * @returns Seconds elapsed.
     */
    solveTime: number;
    /**
     * The objective value of this solution.
     *
     * @returns The objective value, or None if not applicable.
     *
     * @remarks
     * The value is `None` when:
     *
     * - No objective was specified in the model (no {@link Model.minimize} or {@link Model.maximize} call).
     * - The objective expression has an absent value in this solution.
     */
    objective: ObjectiveValue;
    /**
     * Whether this solution was verified (if verification is enabled).
     *
     * @returns True if verified, None if not verified.
     *
     * @remarks
     * When parameter {@link Parameters.verifySolutions} is set to `True` (the
     * default), the solver verifies all solutions found. The verification checks
     * that all constraints in the model are satisfied and that the objective value
     * is computed correctly.
     *
     * The verification is done using separate code (not used during the search).
     * The point is to independently verify the correctness of the solution.
     *
     * Possible values are:
     *
     * - `None` - the solution was not verified (because the parameter
     *    {@link Parameters.verifySolutions} was not set).
     * - `True` - the solution was verified and correct.
     *
     * The value can never be `False` because, in this case, the solver would
     * stop with an error.
     */
    valid?: undefined | true;
};
/**
 * @remarks
 * The result returned by {@link Model.solve} or {@link Solver.solve}.
 *
 * Contains comprehensive information about the solve:
 *
 * **Solution data:**
 *
 * - {@link SolveResult.solution}: The best solution found (or `None` if no solution exists)
 * - {@link SolveSummary.objective}: The objective value of the best solution
 * - {@link SolveSummary.objectiveBound}: The proved bound on the objective
 *
 * **Solve statistics:**
 *
 * - {@link SolveSummary.nbSolutions}: Total number of solutions found
 * - {@link SolveSummary.proof}: Whether optimality or infeasibility was proved
 * - {@link SolveSummary.duration}: Total solve time in seconds
 *
 * **History tracking:**
 *
 * - {@link SolveResult.objectiveHistory}: When each improving solution was found
 * - {@link SolveResult.objectiveBoundHistory}: When each bound improvement was proved
 *
 * @example
 *
 * ```ts
 * import * as CP from "optalcp";
 *
 * const model = new CP.Model();
 * // ... build model ...
 *
 * const result = await model.solve();
 *
 * if (result.solution !== undefined) {
 *     console.log(`Found solution with objective ${result.objective}`);
 *     console.log(`Best solution found at ${result.solutionTime.toFixed(2)}s`);
 *     if (result.proof) {
 *         console.log("Solution is optimal!");
 *     }
 * } else {
 *     if (result.proof) {
 *         console.log("Problem is infeasible");
 *     } else {
 *         console.log("No solution found within time limit");
 *     }
 * }
 * ```
 *
 * @category Solving
 */
export type SolveResult = {
    /**
     * Number of solutions found during the solve.
     *
     * @returns Solution count.
     */
    nbSolutions: number;
    /**
     * Whether the solve ended with a proof (optimality or infeasibility).
     *
     * @returns True if the solve completed with a proof.
     *
     * @remarks
     * When `True`, the solver has either:
     *
     * - Proved optimality (found a solution within the bounds defined by
     *    {@link Parameters.absoluteGapTolerance} and {@link Parameters.relativeGapTolerance}), or
     * - Proved infeasibility (no solution exists)
     *
     * When `False`, the solve was interrupted (e.g., by time limit) before
     * a proof could be established.
     */
    proof: boolean;
    /**
     * Total duration of the solve in seconds.
     *
     * @returns Seconds elapsed.
     */
    duration: number;
    /**
     * Total number of branches explored during the solve.
     *
     * @returns Branch count.
     */
    nbBranches: number;
    /**
     * Total number of failures encountered during the solve.
     *
     * @returns Failure count.
     */
    nbFails: number;
    /**
     * Total number of Large Neighborhood Search steps.
     *
     * @returns LNS step count.
     */
    nbLNSSteps: number;
    /**
     * Total number of restarts performed during the solve.
     *
     * @returns Restart count.
     */
    nbRestarts: number;
    /**
     * Memory used by the solver in bytes.
     *
     * @returns Bytes used.
     */
    memoryUsed: number;
    /**
     * Best objective value found (for optimization problems).
     *
     * @returns The objective value, or None if not applicable.
     *
     * @remarks
     * The value is `None` when:
     *
     * - No objective was specified in the model (no {@link Model.minimize} or {@link Model.maximize} call).
     * - No solution was found.
     * - The objective expression has an absent value in the best solution.
     */
    objective?: ObjectiveValue;
    /**
     * Proved bound on the objective value.
     *
     * @returns The objective bound, or None if no bound was proved.
     *
     * @remarks
     * For minimization problems, this is a lower bound: the solver proved that
     * no solution exists with an objective value less than this bound.
     *
     * For maximization problems, this is an upper bound: the solver proved that
     * no solution exists with an objective value greater than this bound.
     *
     * The value is `None` when no bound was proved or for satisfaction problems.
     */
    objectiveBound?: ObjectiveValue;
    /**
     * Number of integer variables in the model.
     *
     * @returns Integer variable count.
     */
    nbIntVars: number;
    /**
     * Number of interval variables in the model.
     *
     * @returns Interval variable count.
     */
    nbIntervalVars: number;
    /**
     * Number of constraints in the model.
     *
     * @returns Constraint count.
     */
    nbConstraints: number;
    /**
     * Solver name and version string.
     *
     * @returns The solver identification string.
     *
     * @remarks
     * Contains the solver name followed by its version number.
     */
    solver: string;
    /**
     * Number of worker threads actually used during solving.
     *
     * @returns Worker count.
     *
     * @remarks
     * This is the actual number of workers used by the solver, which may differ
     * from the requested {@link Parameters.nbWorkers} if that parameter was not
     * specified (auto-detect) or if the system has fewer cores than requested.
     */
    actualWorkers: number;
    /** @internal @deprecated Use actualWorkers instead. */
    nbWorkers: number;
    /**
     * CPU name detected by the solver.
     *
     * @returns CPU model name.
     *
     * @remarks
     * Contains the CPU model name as detected by the operating system.
     */
    cpu: string;
    /**
     * Objective direction.
     *
     * @returns 'minimize', 'maximize', or None for satisfaction problems.
     *
     * @remarks
     * Indicates whether the model was a minimization problem, maximization problem,
     * or a satisfaction problem (no objective).
     */
    objectiveSense: "minimize" | "maximize" | undefined;
    /**
     * History of objective value improvements during the solve.
     *
     * @returns Sequence of objective entries, one per solution found.
     *
     * @remarks
     * Returns a sequence of {@link ObjectiveEntry} objects, one for each solution
     * found during the solve.
     *
     * Each entry contains:
     *
     * - {@link ObjectiveEntry.solveTime}: When the solution was found
     * - {@link ObjectiveEntry.objective}: The objective value of that solution
     * - {@link ObjectiveEntry.valid}: Whether the solution was verified
     *
     * The entries are ordered chronologically by solve time.
     */
    objectiveHistory: Array<ObjectiveEntry>;
    /**
     * The best solution found during the solve.
     *
     * @returns The best solution, or None if no solution was found.
     *
     * @remarks
     * For optimization problems, this is the solution with the best objective value.
     * For satisfaction problems, this is the last solution found.
     *
     * Returns `None` when no solution was found (the problem may be infeasible
     * or the solve was interrupted before finding any solution).
     */
    solution?: Solution;
    /**
     * Time when the best solution was found.
     *
     * @returns The time in seconds, or None if no solution was found.
     *
     * @remarks
     * The time is measured from the start of the solve, in seconds.
     *
     * Returns `None` when no solution was found.
     */
    solutionTime?: number;
    /**
     * Time of the last objective bound improvement.
     *
     * @returns The time in seconds, or None if no bound was proved.
     *
     * @remarks
     * The time is measured from the start of the solve, in seconds.
     *
     * Returns `None` when no bound was proved during the solve.
     */
    boundTime?: number;
    /**
     * Whether the best solution was verified.
     *
     * @returns True if verified, None if verification was not performed.
     *
     * @remarks
     * When parameter {@link Parameters.verifySolutions} is set to `True` (the
     * default), the solver verifies all solutions found. The verification checks
     * that all constraints in the model are satisfied and that the objective value
     * is computed correctly.
     *
     * Possible values:
     *
     * - `None` - verification was not performed (parameter was not set)
     * - `True` - the solution was verified and correct
     *
     * The value can never be `False` because, in that case, the solver would
     * stop with an error.
     */
    solutionValid?: true | undefined;
    /**
     * History of objective bound improvements during the solve.
     *
     * @returns Sequence of bound entries, one per bound improvement.
     *
     * @remarks
     * Returns a sequence of {@link ObjectiveBoundEntry} objects, one for each
     * bound improvement proved during the solve.
     *
     * Each entry contains:
     *
     * - {@link ObjectiveBoundEntry.solveTime}: When the bound was proved
     * - {@link ObjectiveBoundEntry.value}: The bound value
     *
     * For minimization problems, these are lower bounds. For maximization problems,
     * these are upper bounds. The entries are ordered chronologically by solve time.
     */
    objectiveBoundHistory: Array<ObjectiveBoundEntry>;
    /** @internal @deprecated Use `objectiveBound` instead. */
    lowerBound?: ObjectiveValue;
    /** @internal @deprecated Use `solution` instead. */
    bestSolution?: Solution;
    /** @internal @deprecated Use `solutionTime` instead. */
    bestSolutionTime?: number;
    /** @internal @deprecated Use `boundTime` instead. */
    bestLBTime?: number;
    /** @internal @deprecated Use `solutionValid` instead. */
    bestSolutionValid?: true | undefined;
    /** @internal @deprecated Use `objectiveBoundHistory` instead. */
    lowerBoundHistory: Array<ObjectiveBoundEntry>;
};
/**
 * @remarks
 * The definition of a problem to solve, i.e., all the input the solver needs for solving.
 *
 * This type contains everything that is needed to solve a model. In particular
 * it contains the model itself, the parameters to use for solving (optional)
 * and the starting solution (optional).
 *
 * @category Model exporting
 */
export type ProblemDefinition = {
    /**
     * The model to solve.
     *
     * @category Model exporting
     */
    model: Model;
    /**
     * The parameters to use for solving.
     *
     * @category Model exporting
     */
    parameters?: Parameters;
    /**
     * The solution to start with.
     *
     * @category Model exporting
     */
    warmStart?: Solution;
};
/** @internal @deprecated Use `Model.toJSON` instead. */
export declare function problem2json(problem: ProblemDefinition): string;
/** @internal @deprecated Use `Model.fromJSON` instead. */
export declare function json2problem(json: string): ProblemDefinition;
/** @internal */
export declare function _toText(model: Model, cmd: SolverCommand, params?: Parameters, warmStart?: Solution): Promise<string>;
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
export declare function propagate(model: Model, parameters?: Parameters): Promise<PropagationResult>;
/** @internal @deprecated Use `ModelElement` instead. */
export declare const ModelNode: typeof ModelElement;
/** @internal @deprecated Use `ModelElement` instead. */
export type ModelNode = ModelElement;
/** @internal @deprecated Use `ObjectiveEntry` instead */
export type ObjectiveHistoryItem = ObjectiveEntry;
/** @internal @deprecated Use `ObjectiveBoundEntry` instead */
export type LowerBoundEvent = ObjectiveBoundEntry;
export {};
