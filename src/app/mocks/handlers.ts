// src/mocks/handlers.js
import { rest } from "msw";
import mockProducts from "../../assets/mockProducts.json";
import mockMembers from "../../assets/mockMembers.json";
import mockCoupons from "../../assets/mockCoupons.json";
import { getSessionStorage, setSessionStorage } from "../utils/storage.ts";
import {
  Coupon,
  NewOrder,
  Point,
  PointHistory,
  ProductItem,
  ResponseCartItem,
} from "../../types/types.ts";
import {
  SESSION_STORAGE_KEY_CART_ITEMS,
  SESSION_STORAGE_KEY_COUPONS,
  SESSION_STORAGE_KEY_POINT,
} from "../keys.ts";
import orderItem from "../../components/OrderItem/OrderItem.tsx";

export const handlers = [
  rest.get("/products", (req, res, ctx) => {
    return res(ctx.delay(1000), ctx.status(200), ctx.json(mockProducts));
  }),

  rest.get("/cart-items", (req, res, ctx) => {
    const originalCartItems = getSessionStorage<ResponseCartItem>(
      SESSION_STORAGE_KEY_CART_ITEMS,
      {
        cartItems: [],
        totalPrice: 0,
      }
    );

    return res(ctx.delay(100), ctx.status(200), ctx.json(originalCartItems));
  }),

  rest.post("/cart-items", async (req, res, ctx) => {
    const { productId } = await req.json();

    const originalCartItems = getSessionStorage<ResponseCartItem>(
      SESSION_STORAGE_KEY_CART_ITEMS,
      {
        cartItems: [],
        totalPrice: 0,
      }
    );

    const newItemId = Date.now();

    const newItem = {
      id: newItemId,
      quantity: 1,
      checked: true,
      product: mockProducts.find(
        (product) => product.id === productId
      ) as ProductItem,
    };

    const newCarts = [...originalCartItems.cartItems, newItem];

    setSessionStorage<ResponseCartItem>(SESSION_STORAGE_KEY_CART_ITEMS, {
      cartItems: newCarts,
      totalPrice: newCarts.reduce(
        (acc, cartItem) => acc + cartItem.quantity * cartItem.product.price,
        0
      ),
    });
    return res(ctx.delay(100), ctx.status(201), ctx.json(true));
  }),

  rest.delete("/cart-items/:cartItemId", (req, res, ctx) => {
    const { cartItemId } = req.params;
    const originalCartItems = getSessionStorage<ResponseCartItem>(
      SESSION_STORAGE_KEY_CART_ITEMS,
      {
        cartItems: [],
        totalPrice: 0,
      }
    );

    const newCarts = originalCartItems.cartItems.filter(
      (item) => item.id !== Number(cartItemId)
    );

    setSessionStorage<ResponseCartItem>(SESSION_STORAGE_KEY_CART_ITEMS, {
      cartItems: newCarts,
      totalPrice: newCarts.reduce(
        (acc, cartItem) => acc + cartItem.quantity * cartItem.product.price,
        0
      ),
    });
    return res(ctx.delay(100), ctx.status(204));
  }),

  rest.patch("/cart-items/:cartItemId", async (req, res, ctx) => {
    const { cartItemId } = req.params;
    const { quantity } = await req.json();

    const originalCartItems = getSessionStorage<ResponseCartItem>(
      SESSION_STORAGE_KEY_CART_ITEMS,
      {
        cartItems: [],
        totalPrice: 0,
      }
    );
    const cartItemIndex = originalCartItems.cartItems.findIndex(
      (item) => item.id === Number(cartItemId)
    );
    originalCartItems.cartItems[cartItemIndex].quantity = quantity;
    originalCartItems.totalPrice = originalCartItems.cartItems.reduce(
      (acc, cartItem) => acc + cartItem.quantity * cartItem.product.price,
      0
    );

    setSessionStorage<ResponseCartItem>(
      SESSION_STORAGE_KEY_CART_ITEMS,
      originalCartItems
    );

    return res(ctx.delay(100), ctx.status(200), ctx.json(true));
  }),

  rest.get("/members", (req, res, ctx) => {
    return res(ctx.delay(100), ctx.status(200), ctx.json(mockMembers));
  }),

  rest.get("/coupons", async (req, res, ctx) => {
    const coupons = getSessionStorage(SESSION_STORAGE_KEY_COUPONS, []);

    return res(
      ctx.delay(100),
      ctx.status(200),
      ctx.json(coupons.length > 0 ? coupons : mockCoupons)
    );
  }),

  rest.get("/point", async (req, res, ctx) => {
    const point = getSessionStorage(SESSION_STORAGE_KEY_POINT, {
      pointHistories: [],
      totalPoint: 1000,
    });

    return res(ctx.delay(100), ctx.status(200), ctx.json(point));
  }),

  rest.post("/orders", async (req, res, ctx) => {
    const body: NewOrder = await req.json();
    const { orderItems, orderDiscounts } = body;
    const { couponIds, point } = orderDiscounts;

    const newOrderId = Date.now();

    const totalPrice = orderItems.reduce((acc, orderItem) => {
      const targetPrice = mockProducts.find(
        (product) => product.id === orderItem.productId
      );
      const productPrice = targetPrice === undefined ? 0 : targetPrice.price;

      return acc + orderItem.quantity * productPrice ?? 0;
    }, 0);

    const targetCoupon = mockCoupons.find(
      (coupon) => coupon.id === couponIds[0]
    );

    const discountByCoupon = targetCoupon
      ? (totalPrice * targetCoupon.discountPercent) / 100 +
      targetCoupon.discountAmount
      : 0;

    const realPrice = totalPrice - discountByCoupon - point;

    // 기존 장바구니에서 제거하는 기능 시작
    const cartItems = getSessionStorage<ResponseCartItem>(
      SESSION_STORAGE_KEY_CART_ITEMS,
      {
        cartItems: [],
        totalPrice: 0,
      }
    );

    const orderIds = orderItems.map((orderItem) => orderItem.cartItemId);
    const newCartItems = cartItems.cartItems.filter(
      (cartItem) => !orderIds.includes(cartItem.id)
    );

    setSessionStorage<ResponseCartItem>(SESSION_STORAGE_KEY_CART_ITEMS, {
      cartItems: newCartItems,
      totalPrice: newCartItems.reduce(
        (acc, cartItem) => acc + cartItem.quantity * cartItem.product.price,
        0
      ),
    });
    // 끝

    // 포인트를 적립하는 기능 시작
    const newPoint = Math.floor(realPrice * 0.01); // 배송비를 제외한 결제 금액의 1%를 적립하기로 함
    const userPoint = getSessionStorage<Point>(
      SESSION_STORAGE_KEY_POINT,
      {
        pointHistories: [],
        totalPoint: 1000
      }
    );
    const originalPointHistories = [...userPoint.pointHistories];
    const originalTotalPoint = userPoint.totalPoint;
    const newHistory: PointHistory = {
      orderId: newOrderId,
      earnedPoint: newPoint,
      usedPoint: point
    };
    const newUserPoint: Point = {
      pointHistories: [...originalPointHistories, newHistory],
      totalPoint: Math.floor(originalTotalPoint + newPoint - point)
    };

    setSessionStorage(SESSION_STORAGE_KEY_POINT, newUserPoint);
    // 끝


    // 주문 목록에 저장한다.

    return res(ctx.delay(100), ctx.status(200), ctx.json(true));
  }),
];
