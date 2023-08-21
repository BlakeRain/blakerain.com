import React, { FC } from "react";
import { Currency, CURRENCY_SYMBOLS } from "../../../../lib/tools/position-size/forex";
import {
  computedStopLossQuantity,
  computePositionSize,
  Direction,
} from "../../../../lib/tools/position-size/position";
import { formatNumber } from "../../../../lib/utils";
import Card from "../../../display/Card";
import CurrencySelect from "../../../fields/CurrencySelect";
import DropdownButton from "../../../fields/DropdownButton";
import FloatingLabel from "../../../display/FloatingLabel";
import Grid from "../../../display/Grid";
import NumberInput from "../../../fields/NumberInput";
import Toggle from "../../../fields/Toggle";
import { useAccount } from "../AccountProvider";
import { usePosition } from "../PositionProvider";
import styles from "./PositionInfo.module.scss";

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

  const onPosCurrencyChange = (currency: Currency) => {
    dispatch({ action: "setPosCurrency", currency });
  };

  const onQuoteCurrencyChange = (currency: Currency) => {
    dispatch({ action: "setQuoteCurrency", currency });
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
    console.log("useAffordableClick");
    const { quantity } = computePositionSize(account, position);
    dispatch({ action: "setQuantity", quantity });
  };

  const onUseAvailableClick = () => {
    const { quantity } = computedStopLossQuantity(account, position);
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

  const positionSymbol = CURRENCY_SYMBOLS.get(position.posCurrency);
  const quoteSymbol = CURRENCY_SYMBOLS.get(position.quoteCurrency);

  const posExchange =
    account.currency !== position.posCurrency ? (
      <>
        ({account.currency}&rarr;{position.posCurrency}{" "}
        {formatNumber(
          account.exchangeRates.rates.get(position.posCurrency) || 0,
          account.places,
          positionSymbol
        )}
        )
      </>
    ) : (
      <>&nbsp;</>
    );

  const quoteExchange =
    position.quoteCurrency !== position.posCurrency ? (
      <>
        ({position.posCurrency}&rarr;{position.quoteCurrency}{" "}
        {formatNumber(position.conversion, account.places, quoteSymbol)})
      </>
    ) : (
      <>&nbsp;</>
    );

  return (
    <Card title="Position Information">
      <Grid rowGap={2}>
        <Grid className={styles.positionGrid} columnGap={2}>
          <FloatingLabel
            title={
              <span>
                Position <small>{posExchange}</small>
              </span>
            }
          >
            <CurrencySelect
              value={position.posCurrency}
              onChange={onPosCurrencyChange}
            />
          </FloatingLabel>
          <FloatingLabel
            title={
              <span>
                Quote <small>{quoteExchange}</small>
              </span>
            }
          >
            <CurrencySelect
              value={position.quoteCurrency}
              onChange={onQuoteCurrencyChange}
            />
          </FloatingLabel>
        </Grid>
        <Grid className={styles.positionGrid} columnGap={2}>
          <FloatingLabel title={<span>Position Margin {leverage}</span>}>
            <NumberInput
              value={position.margin * 100}
              places={2}
              suffix="%"
              onChange={onMarginChange}
            />
          </FloatingLabel>
          <FloatingLabel title="Position Direction">
            <select value={position.direction} onChange={onDirectionChange}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </FloatingLabel>
        </Grid>
        <Grid className={styles.priceGrid}>
          <FloatingLabel title="Open Price">
            <NumberInput
              value={position.openPrice}
              places={account.places}
              prefix={quoteSymbol}
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
          <Grid className={styles.quantityGrid} columnGap={2}>
            <FloatingLabel title="Quantity">
              <NumberInput
                value={position.quantity || 0}
                places={2}
                suffix=" units"
                onChange={onQuantityChange}
                disabled={typeof position.quantity !== "number"}
              />
            </FloatingLabel>
            <FloatingLabel title="Use Calculated Value">
              <DropdownButton
                title="Affordable"
                onClick={onUseAffordableClick}
                disabled={
                  typeof position.quantity !== "number" ||
                  position.openPrice === 0
                }
              >
                <button type="button" onClick={onUseAffordableClick}>
                  Affordable Quantity
                </button>
                <button
                  type="button"
                  onClick={onUseAvailableClick}
                  disabled={
                    typeof position.stopLoss !== "number" ||
                    stopLossDistance === 0
                  }
                >
                  Stop Loss Quantity
                </button>
              </DropdownButton>
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
          <Grid className={styles.takeStopGrid} columnGap={2}>
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
          <Grid className={styles.takeStopGrid} columnGap={2}>
            <FloatingLabel title="Stop Loss">
              <NumberInput
                value={position.stopLoss || 0}
                places={account.places}
                prefix={quoteSymbol}
                onChange={onStopLossChange}
                disabled={typeof position.stopLoss !== "number"}
              />
            </FloatingLabel>
            <FloatingLabel title="Stop Loss Distance">
              <NumberInput
                value={stopLossDistance}
                places={account.places}
                prefix={quoteSymbol}
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