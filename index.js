const express = require("express");
const algoliasearch = require("algoliasearch");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
    fuzzySearch
} = require("./levenshtein-search");

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());
app.use(express.json())

const client = algoliasearch("BNUFEQQJJG", "2b51428570ed2e2651eb359fe186c64d");
const index = client.initIndex("easymeal");

const INGREDIENTS = [
    'Additive',
    'Bakery',
    'Beverage',
    'Beverage-Alcoholic',
    'Cereal',
    'Condiment',
    'Dairy',
    'Dish',
    'Essential Oil',
    'Fish',
    'Flower',
    'Fruit',
    'Fungi',
    'Herb',
    'Legume',
    'Maize',
    'Meat',
    'Nuts and Seeds',
    'Plant',
    'Plant Derivative',
    'Seafood',
    'Spice',
    'Vegetable',
    'Salt',
    'Sugar',
    'Baking Powder',
    'White Sugar',
    'Brown Sugar',
    'Water',
    'Lemon Juice',
    'Lime Juice',
    'Fresh Lemon Juice',
    'Coconut Milk',
    'Fresh Lime Juice',
    'Lime , Juice Of',
    'Dried White Wine',
    'White Wine',
    'Red Wine',
    'Gingerroot',
    'Dried Sherry',
    'Beer',
    'Flour',
    'All Purpose Flour',
    'Sesame Seed',
    'Rice',
    'Plain Flour',
    'Cooked Rice',
    'Mayonnaise',
    'Salsa',
    'Tomato Ketchup',
    'Light Mayonnaise',
    'Alfredo Sauce',
    'Sauce',
    'Butter',
    'Milk',
    'Parmesan Cheese',
    'Sour Cream',
    'Unsalted Butter',
    'Cheddar Cheese',
    'Worcestershire Sauce',
    'Couscous',
    'Tahini',
    'Tortilla',
    'Sausage',
    'Vanilla Ice Cream',
    'Extra Virgin Olive Oil',
    'Vanilla Extract',
    'Canola Oil',
    'Lemongrass',
    'Pure Vanilla Extract',
    'Vanilla Essence',
    'Fish Sauce',
    'Salmon Fillet',
    'Anchovy Fillet',
    'Tuna',
    'Smoked Salmon',
    'Salmon',
    'Artichoke Heart',
    'Artichoke',
    'Frozen Artichoke Heart',
    'Canned Artichoke Heart',
    'Water Packed Artichoke Heart',
    'Marinated Artichoke',
    'Lemon',
    'Vanilla',
    'Avocado',
    'Lime',
    'Raisin',
    'Apple',
    'Mushroom',
    'Fresh Mushroom',
    'Active Dry Yeast',
    'Button Mushroom',
    'Dried Yeast',
    'Shiitake Mushroom',
    'Garlic Clove',
    'Garlic',
    'Green Onion',
    'Cilantro',
    'Garlic Powder',
    'Celery',
    'Black Bean',
    'Chickpea',
    'Green Bean',
    'Bean Sprout',
    'Kidney Bean',
    'Pea',
    'Cornstarch',
    'Corn',
    'Cornflour',
    'Cornmeal',
    'Frozen Corn',
    'Corn Kernel',
    'Egg',
    'Chicken Broth',
    'Ground Beef',
    'Bacon',
    'Chicken Breast',
    'Walnut',
    'Pine Nut',
    'Pecan',
    'Nutmeg',
    'Caper',
    'Peanut',
    'Bay Leaf',
    'Honey',
    'Vinegar',
    'Olive',
    'Kalamata Olive',
    'Cocoa Powder',
    'Olive Oil',
    'Soy Sauce',
    'Tomato Sauce',
    'Vegetable Oil',
    'Soy Sauce',
    'Maple Syrup',
    'Scallion',
    'Shrimp',
    'Oyster',
    'Shrimp',
    'Mussel',
    'Pepper',
    'Black Pepper',
    'Cinnamon',
    'Parsley',
    'Chili',
    'Cumin',
    'Tomato',
    'Carrot',
    'Potato',
    'Onion',
    'Paprika'
]



app.get("/recipes/", async (request, response) => {
    try {
        const tags = request.query.ingredients;
        const page = request.query.page;
        let searchTerms = "";
        if (tags) {
            searchTerms = tags.split(",").join("  ");
        }
        console.log(searchTerms);

        let results;
        results = await index.search(searchTerms, {
            similarQuery: searchTerms,
            advancedSyntax: true,
            minProximity: 1,
            attributesToRetrieve: ["ingredients", "title", "img", "objectID"],
            page: page,
            hitsPerPage: 100,
        })

        let hits = results.hits;

        for (let i = 0; i < hits.length; i++) {
            const result = hits[i];
            const highlightedResults = result._highlightResult._tags;
            let numIngredientsMatched = 0;
            let numIngredients = 0;
            for (const result of highlightedResults) {
                if (result.matchedWords.length>0) {
                    numIngredientsMatched++;
                }
                numIngredients++;
            }
            hits[i].numIngredientsMatched = numIngredientsMatched;
            hits[i].numIngredients = numIngredients;
        }
        console.log("results", hits.length);

        return response.json(hits);
    } catch (error) {
        console.log(error);
        return response.status(500).json({ error: error.message });
    }
})

app.get("/recipes/:recipeId", async (request, response) => {
    try {
        const recipeId = request.params.recipeId;
        const ingredients = request.query.ingredients;
        let result = await index.getObject(recipeId);
        const resultIngredients = result.ingredients;

        let numIngredientsMatched = 0;
        let numIngredients = resultIngredients.length;
        let matchedIngredients = [];

        if (ingredients) {
            const allIngredients = ingredients.split(",");
            for (const ingredient of resultIngredients) {
                for (const ingredient1 of allIngredients) {
                    if (ingredient.includes(ingredient1)) {
                        numIngredientsMatched++;
                        matchedIngredients.push(ingredient);
                    }
                }
            }
        }

        result.numIngredientsMatched = numIngredientsMatched;
        result.numIngredients = numIngredients;
        result.matchedIngredients = matchedIngredients;

        return response.json(result);
    } catch (error) {
        console.log(error);
        return response.status(500).json({ error: error.message });
    }
});

function fuzzyMatch(pattern, str) {
    pattern = '.*' + pattern.split('').join('.*') + '.*';
    const re = new RegExp(pattern);
    return re.test(str);
  }

app.get("/ingredients", async (request, response) => {
    const query = request.query.query;
    if (!query) {
        return response.status(400).json({ error: "Missing query parameter" });
    }
    try {

        let foundIngredients = [];

        for (const ingredient of INGREDIENTS) {
            // search for the ingredient in the query

            const match = [...fuzzySearch(ingredient.toLowerCase(), query, 0)];
            if (match.length>0) {
                foundIngredients.push(ingredient);
            }
        }

        return response.json({
            ingredients: foundIngredients
        });
    } catch (error) {
        console.log(error);
        return response.status(500).json({ error: error.message });
    }
    
})


app.listen(5000, () => {
    console.log("Server is listening on port 5000");
}
)


