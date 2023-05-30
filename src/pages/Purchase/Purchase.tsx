import { NewOrder, NewOrderItem } from "../../types/types.ts";
import { useRecoilValue } from "recoil";
import { checkedCartSelector } from "../../recoil/cartAtoms.ts";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

export const PurchaseTitle = styled.div`
  font-style: normal;
  font-weight: 700;
  font-size: 32px;
  line-height: 37px;

  text-align: center;
  letter-spacing: 0.5px;

  margin: 60px 0px 30px 0px;
`;

export const FatBorder = styled.hr`
  border: solid 4px black;
`;

export const ProductItemLayout = styled.div`
  display: flex;
`;

export const ProductItemImage = styled.img`
  width: 100px;
  height: 100px;
`;
export const ProductItemInfo = styled.div``;
export const ProductItemName = styled.div``;
export const ProductItemSubTotalPrice = styled.div``;

function Purchase() {
  const navigate = useNavigate();
  const checkedCartList = useRecoilValue(checkedCartSelector);
  const POINTS = 1000;

  const purchase = () => {
    const order: NewOrder = {
      orders: checkedCartList.map(
        (cart): NewOrderItem => ({
          cartItemId: cart.id,
          quantity: cart.quantity,
          productId: cart.product.id,
        })
      ),
      couponId: null,
      point: POINTS,
    };
    alert(`서버로 보낼 데이터 (아직 안보내용): ${JSON.stringify(order)}`);
    alert("결제가 완료됐습니다.");
    navigate("/order");
  };

  return (
    <div>
      <div>
        <PurchaseTitle>구매 품목</PurchaseTitle>
        <FatBorder />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {checkedCartList.map((cartItem, i) => (
              <ProductItemLayout key={i}>
                <ProductItemImage src={cartItem.product.imageUrl} />
                <ProductItemInfo>
                  <ProductItemName>{cartItem.product.name}</ProductItemName>
                  <ProductItemSubTotalPrice>
                    {cartItem.product.price} x {cartItem.quantity} ={" "}
                    {cartItem.product.price * cartItem.quantity}원
                  </ProductItemSubTotalPrice>
                </ProductItemInfo>
              </ProductItemLayout>
            ))}
          </div>
          <div>
            <div>총 금액</div>
            <div>0원</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div>쿠폰 선택하기</div>
          <div>쿠폰1</div>
        </div>
        <div>
          <div>총 할인 금액</div>
          <div>0원</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div>포인트 선택하기</div>
          <div>0점</div>
        </div>
        <div>
          <div>총 할인 금액</div>
          <div>0원</div>
        </div>
      </div>
      <div>
        <div>총 결제 금액</div>
        <div>0원</div>
      </div>

      <div>
        <div>배송지 선택하기</div>
        <div>
          <input type="radio" checked /> 집
        </div>
      </div>
      <div>
        <div>결제수단 선택하기</div>
        <div>
          <input type="radio" checked /> 카드
        </div>
      </div>
      <button onClick={() => purchase()}>결제하기</button>
    </div>
  );
}

export default Purchase;
