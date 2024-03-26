var express = require('express');
var router = express.Router();

/* GET users listing. */
//call when add category click and render add category page
router.get('/', function (req, res, next) {
  res.render('addCategory', { title: 'Add Category' });
});

//call when edit btn click and render edit category page
router.get('/edit/:id', async function (req, res, next) {
  try {
    const data = await categoryModel.findOne({ _id: new ObjectId(req.params.id) })
    console.log(data);
    res.render('editCategory', { title: 'Edit Category', user: data });
  } catch (error) {
    console.log(error);
  }

});

//call when view btn click and render view category page
router.get('/view/:id', async function (req, res, next) {
  const [data] = await categoryModel.aggregate([
    {
      $match: { _id: new ObjectId(req.params.id), isDeleted: false }
    },
    {
      $lookup: {
        from: "product",
        let: { categoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_category", "$$categoryId"]
              }
            }
          }
        ],
        as: "productId"
      }
    }
  ])
  res.render('viewcategory', { title: 'View Category', user: data });
});

//call when list category click and render list category page
router.get('/list', async function (req, res, next) {
  try {
    const data = await categoryModel.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: "product",
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$isDeleted', false] },
                    { $eq: ["$_category", "$$categoryId"] }
                  ]

                }
              }
            },
            {
              $project: { _id: 1 }
            }
          ],
          as: "productId"
        }
      },
      {
        $project: { name: 1, initials: 1, "totalNumberOfProducts": { $size: "$productId" }, createdAt: 1 }
      }
    ]);
    res.render('listCategory', { title: 'Category', users: data });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error")
  }

});

//call when add category btn click and return in ajax in addCategory.hbs
router.post('/', async (req, res) => {
  try {
    if (req.body.name == '') {
      return res.send({
        status: 409,
        type: "error",
        data: "Enter any Category name"
      });
    }
    if (req.body.name.length <= 4) {
      return res.send({
        status: 409,
        type: "error",
        data: "Name should be more then 4 characters"
      });
    }
    const data = await categoryModel(req.body);
    const isValid = req.body.name.slice(0, 4).toUpperCase();
    const initialsChack = await categoryModel.exists({ initials: isValid, isDeleted: false });
    if (initialsChack) {
      return res.send({
        status: 409,
        type: "error",
        data: "Category already exists"
      })
    }
    // await categoryModel.create(req.body);
    await data.save();
    res.send({
      status: 201,
      type: "success",
      data: "Category added successfully"
    });
  }
  catch (error) {
    console.log(error);
    res.status(500).send("Server error")
  }
});

//call when edit category click and return in ajax in editCategory.hbs
router.put('/:categoryId', async (req, res) => {
  try {
    if (!await categoryModel.exists({ _id: new ObjectId(req.params.categoryId), isDeleted: false })) {
      return res.send({
        status: 409,
        type: "error",
        data: "Category not found"
      })
    }
    const isValid = req.body.name.slice(0, 4).toUpperCase();
    const initialsChack = await categoryModel.exists({ _id: { $ne: new ObjectId(req.params.categoryId) }, initials: isValid, isDeleted: false });
    if (initialsChack) {
      return res.send({
        status: 409,
        type: "error",
        data: "Initial of this category is already exists"
      })
    }
    // if (req.body.initials) {
    //   return res.send({
    //     status: 409,
    //     type: "error",
    //     data: "Initials not valid"
    //   })
    // }
    await categoryModel.updateOne({ _id: req.params.categoryId }, { $set: req.body })
    res.send({
      status: 200,
      type: "success",
      data: "Category updated successfully"
    })
  } catch (error) {
    res.status(500).send("Server error")
  }
});

//call when delete btn click and return in ajax in listCategory.hbs
router.delete('/:categoryId', async (req, res) => {
  try {
    console.log(req.params.categoryId);
    if (!await categoryModel.exists({ _id: new ObjectId(req.params.categoryId), isDeleted: false })) {
      return res.send({
        status: 409,
        type: "error",
        data: "Category not found"
      })
    }
    await categoryModel.updateOne({ _id: req.params.categoryId }, { $set: { isDeleted: true } })
    await productModel.updateMany({ _category: req.params.categoryId }, { $set: { isDeleted: true } })
    res.send({
      status: 200,
      type: "success",
      data: "Category delete successfully"
    })
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error")
  }
});

module.exports = router;
