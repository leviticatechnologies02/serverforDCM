import Cart from "../../models/cart.js";




export const GetCartItems= async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId })
    .populate('items.courseId', 'name price category thumbnail'); // only select needed fields
  res.json(cart || { items: [] });
  }

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

