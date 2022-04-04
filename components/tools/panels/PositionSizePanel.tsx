import React, { FC } from "react";
import { CURRENCY_SYMBOLS } from "../../../lib/tools/forex";
import { formatNumber } from "../../../lib/tools/utils";
import Card from "../../Card";
import Grid from "../../Grid";
import { useAccount } from "../AccountProvider";
import { usePosition } from "../PositionProvider";
import styles from "./PositionSizePanel.module.scss";

const SimplePositionSize: FC = () => {
  const { account } = useAccount();
  const { position } = usePosition();

  const available = account.amount * account.marginRisk;
  const margin =
    position.margin !== 0 ? available / position.margin : available;
  const marginPos =
    margin * (account.exchangeRates.rates.get(position.currency) || 0);
  const amount = marginPos / position.openPrice;

  return (
    <Card title="Simple Position Size">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th>Available Account</th>
            <td className={styles.numberCell}>
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          <tr>
            <th rowSpan={2}>Available Margin</th>
            <td className={styles.numberCell}>
              {formatNumber(
                margin,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          <tr>
            <td className={styles.numberCell}>
              {formatNumber(
                marginPos,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Affordable Quantity</th>
            <td className={styles.numberCell}>
              {position.openPrice !== 0 ? (
                <b>
                  {formatNumber(amount, account.places, undefined, " units")}
                </b>
              ) : (
                "-"
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Given the account <i>Margin Risk</i>, what is the maximum possible
        position size that can be opened at the given position <i>Open Price</i>
        .
      </p>
    </Card>
  );
};

const StopLossPosition: FC = () => {
  const { account } = useAccount();
  const { position } = usePosition();

  const rate = account.exchangeRates.rates.get(position.currency) || 1;
  const available = account.amount * account.positionRisk;
  const availablePos = available * rate;
  const margin =
    position.margin !== 0 ? available / position.margin : available;
  const marginPos = margin * rate;
  const amount = marginPos / position.openPrice;
  const distance = availablePos / amount;

  return (
    <Card title="Stop Loss Position">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th rowSpan={2}>Available Account</th>
            <td className={styles.numberCell}>
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          <tr>
            <td className={styles.numberCell}>
              {formatNumber(
                availablePos,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Loss Distance</th>
            <td className={styles.numberCell}>
              {formatNumber(
                distance,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Loss</th>
            <td className={styles.numberCell}>
              <b>
                {formatNumber(
                  position.openPrice - distance,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.currency)
                )}
              </b>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Given the simple position size of <b>{formatNumber(amount, 2)}</b>{" "}
        units, and the account <i>Position Risk</i>, what is the maximum
        available stop loss.
      </p>
    </Card>
  );
};

const PlannedStopLossQuantity: FC = () => {
  const { account } = useAccount();
  const { position } = usePosition();

  const takeProfitDistance =
    typeof position.takeProfit === "number"
      ? position.direction === "buy"
        ? position.takeProfit - position.openPrice
        : position.openPrice - position.takeProfit
      : 0;

  const stopLossDistance =
    typeof position.stopLoss === "number"
      ? position.direction === "buy"
        ? position.openPrice - position.stopLoss
        : position.stopLoss - position.openPrice
      : 0;

  const rate = account.exchangeRates.rates.get(position.currency) || 1;
  const available = account.amount * account.positionRisk;
  const availablePos = available * rate;
  const amount = availablePos / stopLossDistance;

  return (
    <Card title="Planned Stop Loss Quantity">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th rowSpan={2}>Available Account</th>
            <td className={styles.numberCell}>
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          <tr>
            <td className={styles.numberCell}>
              {formatNumber(
                availablePos,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Loss</th>
            <td className={styles.numberCell}>
              {formatNumber(
                position.stopLoss || 0,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Distance</th>
            <td className={styles.numberCell}>
              {formatNumber(
                stopLossDistance,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Available Quantity</th>
            <td className={styles.numberCell}>
              {stopLossDistance !== 0 ? (
                <b>{formatNumber(amount, account.places)}</b>
              ) : (
                "-"
              )}
            </td>
          </tr>
          {typeof position.takeProfit === "number" && (
            <tr>
              <th>At Take Profit</th>
              <td className={styles.numberCell}>
                {formatNumber(
                  (takeProfitDistance * amount) / rate,
                  account.places,
                  CURRENCY_SYMBOLS.get(account.currency)
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p>
        Given the entered position <i>Stop Loss</i> and the account{" "}
        <i>Position Risk</i>, what is the maximum position size available.
      </p>
    </Card>
  );
};

export const PositionSizePanel: FC = () => {
  const { position } = usePosition();

  return (
    <Grid
      columns={typeof position.stopLoss === "number" ? 3 : 2}
      columnGap={2}
      mb={2}
    >
      <SimplePositionSize />
      <StopLossPosition />
      {typeof position.stopLoss === "number" && <PlannedStopLossQuantity />}
    </Grid>
  );
};

export default PositionSizePanel;
