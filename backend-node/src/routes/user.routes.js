const express = require("express")
const userController = require("../controllers/user.controller")


const router = express.Router()

router.get("/me", userController.getCurrentUser)
app.use("/update", userController.updateDesignationAndName)

module.exports = router