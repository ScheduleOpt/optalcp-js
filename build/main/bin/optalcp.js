#!/usr/bin/env node
import * as CP from "../index.js";
import * as fs from 'fs';
import * as path from 'path';
function readModel(filename) {
    let problem = CP.json2problem(fs.readFileSync(filename, 'utf8'));
    let model = problem.model;
    if (!model.getName()) {
        // Use filename without .json extension as model name
        let name = path.basename(filename, '.json');
        if (name.endsWith('.JSON'))
            name.slice(0, -5);
        model.setName(name);
    }
    return problem;
}
let params = {
    usage: "Usage: npx optalcp [OPTIONS] INPUT_FILE1.json [INPUT_FILE2.json] .."
};
let args = process.argv.slice(2);
if (args.length == 0)
    args = ["--help"];
let restArgs = CP.parseSomeBenchmarkParameters(params, args);
CP.benchmark(readModel, restArgs, params);
//# sourceMappingURL=optalcp.js.map