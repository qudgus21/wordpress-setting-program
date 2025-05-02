const getCredential = require('./getCredential');
const saveCredential = require('./saveCredential');
const getEc2Instances = require('./getEc2Instances');
const createEc2Instance = require('./createEc2Instance');
const deleteEc2Instance = require('./deleteEc2Instance');
const getDomainCounts = require('./getDomainCounts');
const initializeEc2Instance = require('./initializeEc2Instance');
const checkValidDomain = require('./checkValidDomain');
const createBlog = require('./createBlog');
const deleteBlog = require('./deleteBlog');

module.exports = {
  getCredential,
  saveCredential,
  getEc2Instances,
  createEc2Instance,
  deleteEc2Instance,
  getDomainCounts,
  initializeEc2Instance,
  checkValidDomain,
  createBlog,
  deleteBlog,
};
