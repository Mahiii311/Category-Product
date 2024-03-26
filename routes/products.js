var express = require('express');
var router = express.Router();

/* GET home page. */
//call when add product click and render add product page
router.get('/', async function (req, res, next) {
  const data = await categoryModel.find({ isDeleted: false }, "name _id");
  res.render('addProduct', { title: 'Express', category: data });
});

//call when edit btn click  and render edit product page 
router.get('/edit/:id', async function (req, res, next) {
  const data = await productModel.findOne({ _id: new ObjectId(req.params.id) })
  const categorydata = await categoryModel.find({ isDeleted: false }, "name _id")
  // console.log(categorydata);
  // console.log(data);
  categorydata.forEach(element => {
    if (String(element._id) == String(data._category)) {
      element["isSelected"] = true;
    } else {
      element["isSelected"] = false;
    }
  });
  res.render('editProduct', { title: 'Express', user: data, category: categorydata });
});

//call when view btn click and render viewProduct page
router.get('/view/:id', async function (req, res, next) {
  const data = await productModel.aggregate([
    {
      $match: { _id: new ObjectId(req.params.id), isDeleted: false }
    },
    {
      $lookup: {
        from: "category",
        let: { categoryId: "$_category" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$categoryId"]
              }
            }
          },
          {
            $project: { name: 1, _id: 0 }
          }
        ],
        as: "categoryName"
      }
    },
    {
      $unwind: "$categoryName"
    }
  ])
  // console.log(data);
  res.render('viewProduct', { title: 'Express', user: data[0] });
});

//call when list product click or category dropdown click and render listProduct page
router.get('/list/:id?', async function (req, res, next) {
  const categorydata = await categoryModel.find({ isDeleted: false }, "name _id")
  let dataCondition = {
    isDeleted: false,
  };

  if (req.params.id) {
    dataCondition._category = new ObjectId(req.params.id);
    categorydata.forEach(element => {
      if (String(element._id) == req.params.id) {
        element["isSelected"] = true;
      } else {
        element["isSelected"] = false;
      }
    });
    categorydata.unshift({ _id:"", name: "All", isSelected: false})
  }else{
    categorydata.forEach(element => element["isSelected"] = false);
    categorydata.unshift({ _id:"", name: "All", isSelected: true})
  }

  const data = await productModel.aggregate([
    {
      $match: dataCondition
    },
    {
      $lookup: {
        from: "category",
        let: { categoryId: "$_category" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$categoryId"]
              }
            }
          },
          {
            $project: { name: 1, _id: 0 }
          }
        ],
        as: "categoryName"
      }
    },
    {
      $unwind: "$categoryName"
    },
    {
      $project: { name: 1, "category": "$categoryName.name", productId: 1, price: 1, discount: 1, discountedPrice: 1, createdAt: 1 }
    }
  ])
  res.render('listProduct', { title: 'Express', users: data, category: categorydata });
});

//call when add product btn click and return in ajax in addProduct.hbs
router.post('/', async (req, res) => {
  console.log(req.body);
  try {
    if (req.body.discount < 0 || req.body.discount > 100) {
      return res.send({
        status: 411,
        type: "error",
        data: "Enter valid discount"
      });
    }
    const data = await productModel(req.body);
    await data.save();
    res.send({
      status: 201,
      type: "success",
      data: "Product Successfully Added"
    })
  } catch (error) {
    console.log(error);
    if (error.code == 11000) {
      return res.send({
        status: 409,
        type: "error",
        data: "Product already exists"
      })
    }
    // res.status(500).send("Server error");
    res.send(error)
  }
});

//call when edit product click and return in ajax in editProduct.hbs
router.put('/:productId', async (req, res) => {
  try {
    // console.log(await categoryModel.exists({ _id: new ObjectId(req.body._category), isDeleted: false }));
    const chack = await categoryModel.exists({ _id: new ObjectId(req.body._category), isDeleted: false }) && !await productModel.exists({ _id: new ObjectId(req.params.productId), isDeleted: false })
    if (chack) {
      return res.send({
        status: 409,
        type: "error",
        data: "product not found"
      })
    }
    await productModel.updateOne({ _id: req.params.productId }, { $set: req.body })
    res.send({
      status: 200,
      type: "success",
      data: "product updated successfully"
    })
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error")
  }
});

//call when delete btn click and return in ajax in listProduct.hbs
router.delete('/:productId', async (req, res) => {
  try {
    if (!await productModel.exists({ _id: new ObjectId(req.params.productId), isDeleted: false })) {
      return res.send({
        status: 409,
        type: "error",
        data: "Product not found"
      })
    }
    await productModel.updateOne({ _id: req.params.productId }, { $set: { isDeleted: true } })
    res.send({
      status: 200,
      type: "success",
      data: "Product delete successfully"
    })
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error")
  }
});

module.exports = router;
