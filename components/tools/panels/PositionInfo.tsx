import React, { FC } from "react";
import { Currency, CURRENCY_SYMBOLS } from "../../../lib/tools/forex";
import { computePositionSize, Direction } from "../../../lib/tools/position";
import { formatNumber } from "../../../lib/tools/utils";
import Card from "../../Card";
import CurrencySelect from "../../CurrencySelect";
import FloatingLabel from "../../FloatingLabel";
import Grid from "../../Grid";
import NumberInput from "../../NumberInput";
import Toggle from "../../Toggle";
import { useAccount } from "../AccountProvider";
import { usePosition } from "../PositionProvider";

export const PositionInfoPanel: FC = () => {
  const { account } = useAccount();
  const { position, dispatch } = usePosition();

  const leverage =
    position.margin !== 0 ? (
      <small>{`(${Math.round(1 / position.margin)}x leverage)`}</small>
    ) : null;

  // const takeProfitDistance =
  //   typeof position.takeProfit === "number"
  //     ? position.direction === "buy"
  //       ? position.takeProfit - position.openPrice
  //       : position.openPrice - position.takeProfit
  //     : 0;

  const stopLossDistance =
    typeof position.stopLoss === "number"
      ? position.direction === "buy"
        ? position.openPrice - position.stopLoss
        : position.stopLoss - position.openPrice
      : 0;

  const onCurrencyChange = (currency: Currency) => {
    dispatch({ action: "setCurrency", currency });
  };

  const onMarginChange = (margin: number) => {
    dispatch({ action: "setMargin", margin: margin / 100 });
  };

  const onOpenPriceChange = (openPrice: number) => {
    dispatch({ action: "setOpenPrice", openPrice });
  };

  const onQuantityToggleChange = (enabled: boolean) => {
    if (enabled) {
      dispatch({ action: "setQuantity", quantity: 0 });
    } else {
      dispatch({ action: "setQuantity", quantity: null });
    }
  };

  const onQuantityChange = (quantity: number) => {
    dispatch({ action: "setQuantity", quantity });
  };

  const onUseAffordableClick = () => {
    const { quantity } = computePositionSize(account, position);
    dispatch({ action: "setQuantity", quantity });
  };

  const onDirectionChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    dispatch({
      action: "setDirection",
      direction: event.target.value as Direction,
    });
  };

  // const onTakeProfitToggleChange = (enabled: boolean) => {
  //   if (enabled) {
  //     dispatch({ action: "setTakeProfit", takeProfit: position.openPrice });
  //   } else {
  //     dispatch({ action: "setTakeProfit", takeProfit: null });
  //   }
  // };
  //
  // const onTakeProfitChange = (takeProfit: number) => {
  //   dispatch({ action: "setTakeProfit", takeProfit });
  // };
  //
  // const onTakeProfitDistanceChange = (takeProfitDistance: number) => {
  //   dispatch({
  //     action: "setTakeProfit",
  //     takeProfit:
  //       position.direction === "buy"
  //         ? position.openPrice + takeProfitDistance
  //         : position.openPrice - takeProfitDistance,
  //   });
  // };

  const onStopLossToggleChange = (enabled: boolean) => {
    if (enabled) {
      dispatch({ action: "setStopLoss", stopLoss: position.openPrice });
    } else {
      dispatch({ action: "setStopLoss", stopLoss: null });
    }
  };

  const onStopLossChange = (stopLoss: number) => {
    dispatch({ action: "setStopLoss", stopLoss });
  };

  const onStopLossDistanceChange = (stopLossDistance: number) => {
    dispatch({
      action: "setStopLoss",
      stopLoss:
        position.direction === "buy"
          ? position.openPrice - stopLossDistance
          : position.openPrice + stopLossDistance,
    });
  };

  const positionSymbol = CURRENCY_SYMBOLS.get(position.currency);

  const exchange =
    account.currency !== position.currency ? (
      <small>
        (
        {formatNumber(
          account.exchangeRates.rates.get(position.currency) || 0,
          account.places,
          positionSymbol
        )}
        )
      </small>
    ) : null;

  return (
    <Card title="Position Information">
      <Grid rowGap={2}>
        <Grid columns={2} columnGap={2}>
          <FloatingLabel title={<span>Position Currency {exchange}</span>}>
            <CurrencySelect
              value={position.currency}
              onChange={onCurrencyChange}
            />
          </FloatingLabel>
          <FloatingLabel title={<span>Position Margin {leverage}</span>}>
            <NumberInput
              value={position.margin * 100}
              places={2}
              suffix="%"
              onChange={onMarginChange}
            />
          </FloatingLabel>
        </Grid>
        <Grid columns={2} columnGap={2}>
          <FloatingLabel title="Position Direction">
            <select value={position.direction} onChange={onDirectionChange}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </FloatingLabel>
          <FloatingLabel title="Open Price">
            <NumberInput
              value={position.openPrice}
              places={account.places}
              prefix={positionSymbol}
              onChange={onOpenPriceChange}
            />
          </FloatingLabel>
        </Grid>
        <Grid columns={["6rem", "1fr"]} columnGap={2}>
          <Toggle
            value={typeof position.quantity === "number"}
            onChange={onQuantityToggleChange}
            style={{ marginTop: "3rem" }}
          />
          <Grid columns={2} columnGap={2}>
            <FloatingLabel title="Quantity">
              <NumberInput
                value={position.quantity || 0}
                places={2}
                suffix=" units"
                onChange={onQuantityChange}
                disabled={typeof position.quantity !== "number"}
              />
            </FloatingLabel>
            <FloatingLabel title="&nbsp;">
              <button
                type="button"
                onClick={onUseAffordableClick}
                disabled={typeof position.quantity !== "number"}
              >
                Use Affordable
              </button>
            </FloatingLabel>
          </Grid>
        </Grid>
        {/*
        <Grid columns={["6rem", "1fr"]} columnGap={2}>
          <Toggle
            value={typeof position.takeProfit === "number"}
            onChange={onTakeProfitToggleChange}
            style={{ marginTop: "3rem" }}
            />
          <Grid columns={2} columnGap={2}>
            <FloatingLabel title="Take Profit">
              <NumberInput
                value={position.takeProfit || 0}
                places={account.places}
                prefix={positionSymbol}
                onChange={onTakeProfitChange}
                disabled={typeof position.takeProfit !== "number"}
                />
            </FloatingLabel>
            <FloatingLabel title="Take Profit Distance">
              <NumberInput
                value={takeProfitDistance}
                places={account.places}
                prefix={positionSymbol}
                onChange={onTakeProfitDistanceChange}
                disabled={typeof position.takeProfit !== "number"}
                />
            </FloatingLabel>
          </Grid>
        </Grid>
        */}
        <Grid columns={["6rem", "1fr"]} columnGap={2}>
          <Toggle
            value={typeof position.stopLoss === "number"}
            onChange={onStopLossToggleChange}
            style={{ marginTop: "3rem" }}
          />
          <Grid columns={2} columnGap={2}>
            <FloatingLabel title="Stop Loss">
              <NumberInput
                value={position.stopLoss || 0}
                places={account.places}
                prefix={positionSymbol}
                onChange={onStopLossChange}
                disabled={typeof position.stopLoss !== "number"}
              />
            </FloatingLabel>
            <FloatingLabel title="Stop Loss Distance">
              <NumberInput
                value={stopLossDistance}
                places={account.places}
                prefix={positionSymbol}
                onChange={onStopLossDistanceChange}
                disabled={typeof position.stopLoss !== "number"}
              />
            </FloatingLabel>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  );
};
