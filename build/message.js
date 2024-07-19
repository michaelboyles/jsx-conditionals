// This script exists solely so that running npm pack on the root-level
// project will fail, because the path to this script will be wrong.
// To publish the project, build it, cd to /dist and publish from there.
// All this to remove /dist from the tarball... NPM is jank.

console.log("----------------------------------------");
console.log("You are correctly pack-ing from /dist :)");
console.log("----------------------------------------");
