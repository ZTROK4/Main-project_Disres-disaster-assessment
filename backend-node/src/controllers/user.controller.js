const prisma = require("../db/prisma")

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        designation: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      name: user.name,
      designation: user.designation,
      email: user.email,
      role: user.role
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

exports.updateDesignationAndName = async (req, res) => {
  try {
    const userId = req.user.userId
    const { designation,name } = req.body

    if (!designation) {
      return res.status(400).json({ message: "Designation is required" })
    }

    // Allowed list (optional but recommended)
    const allowedDesignations = [
      "Fire Officer",
      "Police Officer",
      "Medical Officer",
      "Volunteer"
    ]

    if (!allowedDesignations.includes(designation)) {
      return res.status(400).json({ message: "Invalid designation" })
    }

    // Optional: prevent changing again
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (existingUser.designation) {
      return res.status(400).json({
        message: "Designation already set"
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { designation,name }
    })

    res.json({
      message: "Designation updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        designation: updatedUser.designation,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}