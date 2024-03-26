module.exports = function (mongoose) {
    const option = {
        collection: "category",
        timestamps: {
            createdOn: "createdOn",
            updatesOn: "updatedOn"
        }
    }

    console.log("This is categorySchema");
    const categorySchema = new mongoose.Schema({
        isDeleted: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            required: true,
            unique: true
        },
        initials: {
            type: String,
            // unique: true
            // required:true
        }
    }, option);

    categorySchema.pre(['updateOne', 'save'], async function (next) {
        console.log("----save or update-----");
        if (this.name) {
            this.initials = this.name.slice(0, 4).toUpperCase();
            // console.log(this.initials);
            next();
        }

        //change initials and productId when edit category name
        if (this.getUpdate().$set?.name) {
            this.getUpdate().$set.initials = this.getUpdate().$set.name.slice(0, 4).toUpperCase();
            let productdata = await productModel.find({ _category: this.getQuery()._id }, "_id productId")
            // console.log(productdata);
            productdata.forEach(async (element) => {
                console.log(this.getUpdate().$set.initials + element.productId.slice(4));
                element.productId = this.getUpdate().$set.initials + element.productId.slice(4)
                await productModel.findByIdAndUpdate(element._id, { $set: { productId: element.productId } });
            });
            // console.log(this.getUpdate().$set);
            // console.log(this.getQuery()._id);
            next();
        }
    });

    return categorySchema;
}