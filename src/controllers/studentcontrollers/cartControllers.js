import Cart from "../../models/cart.js";




export const GetCartItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate('items.courseId', 'name price thumbnail');

    if (!cart) {
      return res.json({ items: [] });
    }

    const filteredCart = {
      _id: cart._id,
      items: cart.items.map(item => ({
       
          _id: item.courseId._id.toString(),
          name: item.courseId.name,
          price: item.courseId.price,
          thumbnail: item.courseId.thumbnail
      
      }))
    };

    console.log('Filtered cart:', filteredCart);
    res.json(filteredCart);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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