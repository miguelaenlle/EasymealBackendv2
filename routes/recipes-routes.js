const express = require("express");
const recipeController = require("../controllers/recipe-controller");

const router = express.Router();

router.get("/", recipeController.getRecipes)
router.get("/:recipeId", recipeController.getRecipe)

module.exports = router;