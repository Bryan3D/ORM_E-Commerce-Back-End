const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint


// get all products and include its associated Category and Tag data (using the ProductTag model) in the response body (HINT: You'll need to use the ProductTag model to include the associated tag data)

router.get('/', (req, res) => {

  // To find all the products along with their associated categories and tags, we'll execute the following query: 
  
  Product.findAll({
    attributes: ['id', 'product_name', 'price', 'stock', 'category_id'],
    include: [
      {
        model: Category,
        attributes: ['id', 'category_name'],
      },
      {
        model: Tag,
        attributes: ['id', 'tag_name'],
      },
    ],
  })
    .then((dbProductData) => res.json(dbProductData))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });

});


// get one product by its `id` value and include its associated Category and Tag data in the response body (HINT: You'll need to use the ProductTag model to include the associated tag data)

router.get('/:id', (req, res) => {
  

  // To find a single product by its primary key, we'll execute the following query:
  // find a single product by its `id` and include its associated Category and Tag data.
  
  Product.findOne({
    where: {
      id: req.params.id,
    },
    attributes: ['id', 'product_name', 'price', 'stock', 'category_id'],
    include: [
      {
        model: Category,
        attributes: ['id', 'category_name'],
      },
      {
        model: Tag,
        attributes: ['id', 'tag_name'],
      },
    ],
  })

});

// create new product
// The product's `price` and `stock` values should be set to 0 by default. If a `category_id` is provided, the product should be associated with that category. If no `category_id` is provided, the product can still be created, but it should not be associated with a category. If a tag is provided, the product should be associated with that tag by creating a new ProductTag. If no tag is provided, the product can still be created, but it should not be associated with a tag.

router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((productData) => {
      if (!productData) {
        res.status(404).json({ message: 'No product found with this id!' });
        return;
      }
      res.json(productData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });

});

module.exports = router;