const getIndex = require("../helpers/get-index")

const getRecipes = async (request, response) => {
    const index = await getIndex();
}

const getRecipe = async (request, response) => {

}

module.exports = {
    getRecipes,
    getRecipe
}