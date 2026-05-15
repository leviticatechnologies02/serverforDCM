import Cart from "../../models/cart.js";

export const GetCartItems = async (req, res) => {
  try {
    const cart = await Cart.findOne(
      { userId: req.params.userId }
    ).populate({
      path: "items.courseId",
      select: "_id name price thumbnail",
    });

    // Empty cart
    if (!cart) {
      return res.status(200).json({
        items: [],
      });
    }

    // Remove deleted courses safely
    const items = cart.items
      .filter(item => item.courseId)
      .map(item => ({
        _id: item.courseId._id,
        name: item.courseId.name,
        price: item.courseId.price,
        thumbnail: item.courseId.thumbnail,
      }));

    return res.status(200).json({
      items,
    });

  } catch (error) {
    console.error("Error fetching cart items:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Add item to cart
export const AddItemToCart= async (req, res) => {
  const { userId, courseId } = req.body;
  console.log(req.body)
  let cart = await Cart.findOne({ userId });
  console.log(cart)

  if (!cart) {
    cart = new Cart({ userId, items: [{courseId}] });
  } else {
    const existing = cart.items.find(i => i.courseId.toString() === courseId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({courseId});
    }
  }
  await cart.save();
  res.json(cart);
}

// Remove item
export const RemoveItem= async (req, res) => {
  
  const { userId, courseId } = req.body;
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = cart.items.filter(i => i.courseId.toString() !== courseId);
    await cart.save();
  }
  res.json(cart);
}

// Delete the entire cart document for a user
export const DeleteCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const deleted = await Cart.findOneAndDelete({ userId });

    if (!deleted) {
      return res.status(404).json({ message: 'No cart found to delete' });
    }

    res.json({ message: 'Cart deleted successfully', cartId: deleted._id });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};