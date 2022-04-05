import React, { FC } from "react";
import { CURRENCY_SYMBOLS } from "../../../lib/tools/forex";
import {
  computedStopLossQuantity,
  computePositionSize,
  computeStopLoss,
} from "../../../lib/tools/position";
import { formatNumber } from "../../../lib/tools/utils";
import Card from "../../Card";
import Grid from "../../Grid";
import { useAccount } from "../AccountProvider";
import { usePosition } from "../PositionProvider";
import styles from "./PositionSizePanel.module.scss";

const SimplePositionSize: FC = () => {
  const { account } = useAccount();
  const { position } = usePosition();
  const { available, availablePos, margin, marginPos, amount } =
    computePositionSize(account, position);

  return (
    <Card title="Simple Position Size">
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
                <b>{formatNumber(amount, 2, undefined, " units")}</b>
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
  const { available, availablePos, amount } = computePositionSize(
    account,
    position
  );
  const { distance } = computeStopLoss(account, position, amount);

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
                  position.direction === "buy"
                    ? position.openPrice - distance
                    : position.openPrice + distance,
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
  const { available, availablePos, stopLossDistance, amount, margin } =
    computedStopLossQuantity(account, position);

  return (
    <Card title="Planned Stop Loss Maximum">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th rowSpan={2}>Available Account</th>
            <td
              className={styles.numberCell}
              title="Funds available under position risk"
            >
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          <tr>
            <td
              className={styles.numberCell}
              title="Funds available under position risk in position currency"
            >
              {formatNumber(
                availablePos,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Loss</th>
            <td className={styles.numberCell} title="Specified stop loss">
              {formatNumber(
                position.stopLoss || 0,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Distance</th>
            <td className={styles.numberCell} title="Stop loss distance">
              {formatNumber(
                stopLossDistance,
                account.places,
                CURRENCY_SYMBOLS.get(position.currency)
              )}
            </td>
          </tr>
          <tr>
            <th>Available Quantity</th>
            <td
              className={styles.numberCell}
              title="Position size under given stop loss and position risk"
            >
              {stopLossDistance !== 0 ? (
                <b>{formatNumber(amount, account.places)}</b>
              ) : (
                "-"
              )}
            </td>
          </tr>
          <tr>
            <th rowSpan={2}>Required Margin</th>
            <td
              className={styles.numberCell}
              title="Margin requirement for maximum position size"
            >
              {formatNumber(
                margin,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          <tr>
            <td
              className={styles.numberCell}
              title="Margin requirement as a percentage of account value"
            >
              {formatNumber((margin / account.amount) * 100, 2, undefined, "%")}
            </td>
          </tr>
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
