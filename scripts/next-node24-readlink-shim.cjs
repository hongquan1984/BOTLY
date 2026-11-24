// Next 16's Windows output-file tracing expects readlink() on regular files
// to reject with EINVAL. Node 24 returns EISDIR instead, which aborts an
// otherwise valid production build. Treat only that compatibility case as a
// non-symlink result; all other filesystem errors remain visible.
const fs = require("node:fs");
const readlink = fs.promises.readlink.bind(fs.promises);

const readlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = (...args) => {
  try {
    return readlinkSync(...args);
  } catch (error) {
    if (error && error.code === "EISDIR") return null;
    throw error;
  }
};

const readlinkCallback = fs.readlink.bind(fs);
fs.readlink = (...args) => {
  const callback = args[args.length - 1];
  if (typeof callback !== "function") return readlinkCallback(...args);
  const nextArgs = args.slice(0, -1);
  return readlinkCallback(...nextArgs, (error, target) => {
    if (error && error.code === "EISDIR") return callback(null, null);
    return callback(error, target);
  });
};

fs.promises.readlink = async (...args) => {
  try {
    return await readlink(...args);
  } catch (error) {
    if (error && error.code === "EISDIR") return null;
    throw error;
  }
};
