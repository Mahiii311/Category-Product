module.exports = function (mongoose) {
    const option = {
        collection: "product",
        timestamps: {
            createdOn: "createdOn",
            updatesOn: "updatedOn"
        }
    }

    console.log("This is productSchema");

    const productSchema = new mongoose.Schema({
        isDeleted: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            required: true,
            unique: true
        },
        _category: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "category"
        },
        productId: {
            type: String,
            // required: true
        },
        price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            required: true
        },
        discountedPrice: {
            type: Number,
            // required: true
        }
    }, option);

    productSchema.pre(['updateOne', 'save'], async function (next) {
        try {
            console.log("-----save------");
            if (this.price && this.discount) {
                this.discountedPrice = (this.price * ((100 - this.discount) / 100));
                console.log(this.discountedPrice);
                const data = await productModel.find({ _category: this._category }).count() + 1;
                const pre = await categoryModel.findOne({ _id: this._category }, "initials");
                this.productId = `${pre.initials}${data.toString().padStart(3, '0')}`
                console.log(data.toString().padStart(3, '0'));
                console.log(pre.initials);

                console.log(this);
                next();
            }

            if (this.getUpdate().$set.price) {
                console.log("this is called");
                console.log(this.getUpdate().$set);
                this.getUpdate().$set.discountedPrice = (this.getUpdate().$set.price * ((100 - this.getUpdate().$set.discount) / 100)).toFixed(4)
                //chack category change or not
                const isCategoryChange = await productModel.findOne({ _id: this.getQuery()._id }, "_category")
                if (this.getUpdate().$set?._category !== isCategoryChange._category.toString()) {
                    const data = await productModel.find({ _category: this.getUpdate().$set._category }).count() + 1;
                    const pre = await categoryModel.findOne({ _id: this.getUpdate().$set._category }, "initials");
                    this.getUpdate().$set.productId = `${pre.initials}${data.toString().padStart(3, '0')}`
                }
                next();
            }
            // console.log(this._conditions._id);
            // console.log(this.getQuery()._id);
            // next();
        } catch (err) {
            console.log('err => ', err);
        }
    });
    return productSchema;
}