const express = require("express");
const algoliasearch = require("algoliasearch");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
    fuzzySearch
} = require("./levenshtein-search");

const app = express();
const port = process.env.PORT || 3200;

app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());
app.use(express.json())

const client = algoliasearch("BNUFEQQJJG", "2b51428570ed2e2651eb359fe186c64d");
const index = client.initIndex("easymeal");
const ingredientsIndex = client.initIndex("ingredients");

const INGREDIENTS = ['Flour',
'Extract',
'Powder',
'Soda',
'Sugar',
'Butter',
'Cocoa',
'Coconut',
'Confectioners',
'Cornmeal',
'Cornstarch',
'Cream',
'Chocolate',
'Egg',
'Milk',
'Honey',
'Molasses',
'Shortening',
'Vanilla',
'Wheat',
'Water',
'Yeast',
'Cider',
'Vinegar',
'Almond',
'Apricot',
'Banana',
'Beef',
'Chicken',
'Pork',
'Turkey',
'Bacon',
'Ham',
'Lamb',
'Beefsteak',
'Porkchop',
'Sausage',
'Salmon',
'Shrimp',
'Lobster',
'Tuna',
'Crab',
'Mackerel',
'Sardine',
'Clam',
'Oyster',
'Herring',
'Milkshake',
'Coffee',
'Tea',
'Juice',
'Watermelon',
'Pineapple',
'Strawberry',
'Blueberry',
'Apple',
'Mango',
'Pear',
'Peach',
'Orange',
'Lettuce',
'Carrot',
'Potato',
'Broccoli',
'Onion',
'Tomato',
'Garlic',
'Cabbage',
'Celery',
'Cucumber',
'Rice',
'Quinoa',
'Oats',
'Barley',
'Bulgur',
'Corn',
'Couscous',
'Bread',
'Pasta',
'Salt',
'Pepper',
'Ginger',
'Cumin',
'Oregano',
'Cinnamon',
'Paprika',
'Mustard',
'Basil',
'Sauce',
'Mayonnaise',
'Dressing',
'Oil',
'Soy',
'Ketchup',
'Salsa',
'Relish',
'Lemon',
'Lime',
'Grapefruit',
'Olive',
'Walnut',
'Cashew',
'Pecan',
'Peanut',
'Sunflower',
'Sesame',
'Pistachio',
'Pumpkin',
'Flaxseed',
'Blackberry',
'Raspberry',
'Cranberry',
'Gooseberry',
'Currant',
'Elderberry',
'Boysenberry',
'Cherry',
'Tangerine',
'Kumquat',
'Mandarin',
'Pomegranate',
'Kiwi',
'Dragonfruit',
'Guava',
'Passionfruit',
'Lychee',
'Papaya',
'Avocado',
'Nutmeg',
'Cardamom',
'Turmeric',
'Cloves',
'Coriander',
'Rosemary',
'Thyme',
'Parsley',
'Dill',
'Sage',
'Chive',
'Cayenne',
'Nutella',
'Peanutbutter',
'Jam',
'Hazelnut',
'Marzipan',
'Macadamia',
'Butterscotch',
'Maplesyrup',
'Agave',
'Stevia',
'Caramel',
'Toffee',
'Marshmallow',
'Ganache',
'Buttermilk',
'Yogurt',
'Cheese',
'Cheddar',
'Mozzarella',
'Parmesan',
'Swiss',
'Brie',
'Gouda',
'Provolone',
'Feta',
'Bluecheese',
'Swisscheese',
'Soymilk',
'Almondmilk',
'Coconutmilk',
'Oatmilk',
'Cashewmilk']



app.get("/recipes/", async (request, response) => {
    try {
        const tags = request.query.ingredients;
        const page = request.query.page;
        const minCalories = request.query.minCalories;
        const maxCalories = request.query.maxCalories;

        let searchTerms = "";
        if (tags) {
            const tagsList = tags.split(",");
            for (let i = 0; i < tagsList.length; i++) {
                const tag = tagsList[i];
                const searchTermsLength = searchTerms.length;
                const tagLength = tag.length;
                if (searchTermsLength + tagLength + 1> 500) {
                    break;
                }
                
                searchTerms += tag + " ";
            }

            searchTerms = tags.split(",").join("  ");
        }
        console.log(searchTerms);
        let results;
        let filters = `(NOT img:"/recipedb/static/recipe_temp.jpg")`;
        if (minCalories && maxCalories) {
            filters += ` AND energy >= ${minCalories} AND energy <= ${maxCalories}`;
        } else if (minCalories) {
            filters += ` AND energy >= ${minCalories}`;
        } else if (maxCalories) {
            filters += ` AND energy <= ${maxCalories}`;
        }
        console.log(filters)
        results = await index.search(searchTerms, {
            similarQuery: searchTerms,
            advancedSyntax: true,
            minProximity: 1,
            filters: filters,
            attributesToRetrieve: ["ingredients", "title", "img", "objectID", "healthScore", "url", "energy"],
            page: page,
            hitsPerPage: 100,
        })

        let hits = results.hits;


        for (let i = 0; i < hits.length; i++) {
            let matchedWords = [];
            const result = hits[i];
            const highlightedResults = result._highlightResult._tags;
            console.log(highlightedResults);
            let ingredients = []
            let numIngredientsMatched = 0;
            let numIngredients = 0;
            for (const result of highlightedResults) {
                if (result.matchedWords.length>0) {
                    numIngredientsMatched++;
                    matchedWords.push(result.value.replace("<em>", "").replace("</em>", ""));
                    ingredients.push({
                        name: result.value.replace("<em>", "").replace("</em>", ""),
                        available: true,
                    })
                } else {
                    ingredients.push({
                        name: result.value.replace("<em>", "").replace("</em>", ""),
                        available: false,
                    })
                }
                numIngredients++;
            }
            hits[i].numIngredientsMatched = numIngredientsMatched;
            hits[i].numIngredients = numIngredients;
            hits[i].numMissing = numIngredients - numIngredientsMatched;
            hits[i].ingredients = ingredients;
        }
        const sortedHits = hits.sort((a, b) => {
            return (a.numMissing - b.numMissing);
        })

        return response.json({recipes: sortedHits});
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

        return response.json({recipe: result});
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
    const page = request.query.page || 0;

    if (!query) {
        return response.status(400).json({ error: "Missing query parameter" });
    }
    
    let results;
    try {
        results = await ingredientsIndex.search(query, {
            minProximity: 1,
            page: page,
            hitsPerPage: 1000,
        })
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Error searching for ingredients" });
    }

    return response.json({ingredients: results.hits});
})

app.get("/speech-parser", async (request, response) => {
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


app.listen(port, () => {
    console.log("Server is listening on port 5000");
}
)


