const express = require("express")
const userController = require("../controllers/user.controller")


const router = express.Router()

router.get("/me", userController.getCurrentUser)
router.patch("/update", userController.updateDesignationAndName)

module.exports = router