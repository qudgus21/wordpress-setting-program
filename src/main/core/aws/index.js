const getCredential = require('./getCredential');
const saveCredential = require('./saveCredential');
const getEc2Instances = require('./getEc2Instances');
const createEc2Instance = require('./createEc2Instance');
const deleteEc2Instance = require('./deleteEc2Instance');

module.exports = {
  getCredential,
  saveCredential,
  getEc2Instances,
  createEc2Instance,
  deleteEc2Instance,
};
