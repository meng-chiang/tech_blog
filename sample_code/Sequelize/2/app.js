const User = require('./models').User;

(async () => {
  let user = await User.findAll({
    where: {
      name: 'admin'
    }
  });
  console.log(`find ${user.length}:`);
  for (let u of user) {
    console.log(JSON.stringify(u));
  }
})();