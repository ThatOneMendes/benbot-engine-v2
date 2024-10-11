const { workerData, parentPort, isMainThread } = require("node:worker_threads")
const generateSokoben = require("../utils/generate_sokoben");
const classTransformer = require("class-transformer")

if(isMainThread) return;

const sokoben = generateSokoben(workerData)

parentPort.postMessage(classTransformer.instanceToPlain(sokoben))