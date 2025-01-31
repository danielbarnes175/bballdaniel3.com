module.exports = {
    eq: function (a, b) {
        console.log(`Comparing ${a} and ${b}`);
        return a === b
    },
    ifeq: function(a, b, options){
        if (a === b) {
          return options.fn(this);
          }
        return options.inverse(this);
    },
}