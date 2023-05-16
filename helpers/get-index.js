const algoliasearch = require("algoliasearch");

const getIndex = async () => {
    const client = algoliasearch("BNUFEQQJJG", "2b51428570ed2e2651eb359fe186c64d");
    const index = await client.initIndex("easymeal");

    return index;
}

module.exports = getIndex;