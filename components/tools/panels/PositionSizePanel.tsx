import React, { FC } from "react";
import cn from "classnames";
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
  const {
    available,
    availablePos,
    availableQuote,
    margin,
    marginPos,
    marginQuote,
    quantity,
    actual,
  } = computePositionSize(account, position);

  return (
    <Card title="Simple Position Size">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th
              rowSpan={
                1 +
                (account.currency !== position.posCurrency ? 1 : 0) +
                (position.posCurrency !== position.quoteCurrency ? 1 : 0)
              }
            >
              Available Account
            </th>
            <td className={styles.numberCell}>
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          {account.currency !== position.posCurrency && (
            <tr>
              <td className={styles.numberCell}>
                {formatNumber(
                  availablePos,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.posCurrency)
                )}
              </td>
            </tr>
          )}
          {position.posCurrency !== position.quoteCurrency && (
            <tr>
              <td className={styles.numberCell}>
                {formatNumber(
                  availableQuote,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
              </td>
            </tr>
          )}
          <tr>
            <th
              rowSpan={
                1 +
                (account.currency !== position.posCurrency ? 1 : 0) +
                (position.posCurrency !== position.quoteCurrency ? 1 : 0)
              }
            >
              Available Margin
            </th>
            <td className={styles.numberCell}>
              {formatNumber(
                margin,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          {account.currency !== position.posCurrency && (
            <tr>
              <td className={styles.numberCell}>
                {formatNumber(
                  marginPos,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.posCurrency)
                )}
              </td>
            </tr>
          )}
          {position.posCurrency !== position.quoteCurrency && (
            <tr>
              <td className={styles.numberCell}>
                {formatNumber(
                  marginQuote,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
              </td>
            </tr>
          )}
          <tr>
            <th>Affordable Quantity</th>
            <td className={styles.numberCell}>
              {position.openPrice !== 0 ? (
                <b>{formatNumber(quantity, 2, undefined, " units")}</b>
              ) : (
                "-"
              )}
            </td>
          </tr>
          {actual && (position.quantity || 0) > 0 && (
            <>
              <tr>
                <td>&nbsp;</td>
                <td />
              </tr>
              <tr>
                <th>Actual Quantity</th>
                <td className={styles.numberCell}>
                  {formatNumber(position.quantity || 0, 2, undefined, " units")}
                </td>
              </tr>
              <tr>
                <th>Actual Cost</th>
                <td className={styles.numberCell}>
                  {formatNumber(
                    (position.quantity || 0) * position.openPrice,
                    account.places,
                    CURRENCY_SYMBOLS.get(position.posCurrency)
                  )}
                </td>
              </tr>
              <tr>
                <th
                  rowSpan={
                    2 +
                    (account.currency !== position.posCurrency ? 1 : 0) +
                    (position.posCurrency !== position.quoteCurrency ? 1 : 0)
                  }
                >
                  Required Margin
                </th>
                <td className={styles.numberCell}>
                  {formatNumber(
                    actual.costQuote,
                    account.places,
                    CURRENCY_SYMBOLS.get(position.posCurrency)
                  )}
                </td>
              </tr>
              {position.quoteCurrency !== position.posCurrency && (
                <tr>
                  <td className={styles.numberCell}>
                    {formatNumber(
                      actual.costPos,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.quoteCurrency)
                    )}
                  </td>
                </tr>
              )}
              {account.currency !== position.posCurrency && (
                <tr>
                  <td className={styles.numberCell}>
                    {formatNumber(
                      actual.cost,
                      account.places,
                      CURRENCY_SYMBOLS.get(account.currency)
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <td
                  className={cn(styles.numberCell, {
                    "text-danger":
                      Math.round(100 * actual.margin) >
                      100 * account.marginRisk,
                  })}
                >
                  {formatNumber(actual.margin * 100, 2, undefined, "%")}
                </td>
              </tr>
              {Math.round(100 * actual.margin) > 100 * account.marginRisk && (
                <tr>
                  <td
                    colSpan={2}
                    className="text-danger"
                    style={{ paddingTop: "2rem" }}
                  >
                    Actual quantity of {formatNumber(position.quantity || 0, 2)}{" "}
                    units exceeds account margin risk of{" "}
                    {formatNumber(account.marginRisk * 100, 0, undefined, "%")}{" "}
                    by{" "}
                    {formatNumber(
                      actual.costPos - available,
                      2,
                      CURRENCY_SYMBOLS.get(account.currency)
                    )}
                    .
                  </td>
                </tr>
              )}
            </>
          )}
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
  const quantity =
    typeof position.quantity === "number"
      ? position.quantity
      : computePositionSize(account, position).quantity;
  const { available, availablePos, availableQuote, distance, actual } =
    computeStopLoss(account, position, quantity);

  return (
    <Card title="Stop Loss Position">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th
              rowSpan={
                1 +
                (account.currency !== position.posCurrency ? 1 : 0) +
                (position.quoteCurrency !== position.posCurrency ? 1 : 0)
              }
            >
              Available Account
            </th>
            <td className={styles.numberCell}>
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
            </td>
          </tr>
          {account.currency !== position.posCurrency && (
            <tr>
              <td className={styles.numberCell}>
                {formatNumber(
                  availablePos,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.posCurrency)
                )}
              </td>
            </tr>
          )}
          {position.quoteCurrency !== position.posCurrency && (
            <tr>
              <td className={styles.numberCell}>
                {formatNumber(
                  availableQuote,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
              </td>
            </tr>
          )}
          <tr>
            <th>Stop Loss Distance</th>
            <td className={styles.numberCell}>
              {formatNumber(
                distance,
                account.places,
                CURRENCY_SYMBOLS.get(position.posCurrency)
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
                  CURRENCY_SYMBOLS.get(position.posCurrency)
                )}
              </b>
            </td>
          </tr>
          {actual && (
            <>
              <tr>
                <td>&nbsp;</td>
                <td />
              </tr>
              <tr>
                <th>Actual Distance</th>
                <td className={styles.numberCell}>
                  {formatNumber(
                    actual.distance,
                    account.places,
                    CURRENCY_SYMBOLS.get(position.posCurrency)
                  )}
                </td>
              </tr>
              <tr>
                <th>Actual Loss</th>
                <td className={styles.numberCell}>
                  {formatNumber(
                    actual.loss,
                    account.places,
                    CURRENCY_SYMBOLS.get(account.currency)
                  )}
                </td>
              </tr>
              <tr>
                <th>Actual Risk</th>
                <td
                  className={cn(styles.numberCell, {
                    "text-danger":
                      Math.round(100 * actual.risk) >
                      100 * account.positionRisk,
                  })}
                >
                  {formatNumber(actual.risk * 100, 2, undefined, "%")}
                </td>
              </tr>
              {Math.round(100 * actual.risk) > 100 * account.positionRisk && (
                <tr>
                  <td
                    colSpan={2}
                    className="text-danger"
                    style={{ paddingTop: "2rem" }}
                  >
                    Actual stop loss of{" "}
                    {formatNumber(
                      actual.loss,
                      2,
                      CURRENCY_SYMBOLS.get(account.currency)
                    )}{" "}
                    exceeds account position risk of{" "}
                    {formatNumber(
                      account.positionRisk * 100,
                      0,
                      undefined,
                      "%"
                    )}{" "}
                    by{" "}
                    {formatNumber(
                      actual.loss - available,
                      2,
                      CURRENCY_SYMBOLS.get(account.currency)
                    )}
                    .
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
      <p>
        Given the{" "}
        {typeof position.quantity === "number" ? "specified" : "simple"}{" "}
        position size of <b>{formatNumber(quantity, 2)}</b> units, and the
        account <i>Position Risk</i>, what is the maximum available stop loss.
      </p>
    </Card>
  );
};

const PlannedStopLossQuantity: FC = () => {
  const { account } = useAccount();
  const { position } = usePosition();
  const {
    available,
    availablePos,
    availableQuote,
    stopLossDistance,
    quantity,
    margin,
  } = computedStopLossQuantity(account, position);

  return (
    <Card title="Planned Stop Loss Maximum">
      <table className={styles.resultTable}>
        <tbody>
          <tr>
            <th
              rowSpan={
                1 +
                (account.currency !== position.posCurrency ? 1 : 0) +
                (position.quoteCurrency !== position.posCurrency ? 1 : 0)
              }
            >
              Available Account
            </th>
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
          {account.currency !== position.posCurrency && (
            <tr>
              <td
                className={styles.numberCell}
                title="Funds available under position risk in position currency"
              >
                {formatNumber(
                  availablePos,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.posCurrency)
                )}
              </td>
            </tr>
          )}
          {position.quoteCurrency !== position.posCurrency && (
            <tr>
              <td
                className={styles.numberCell}
                title="Funds available under position risk in quote currency"
              >
                {formatNumber(
                  availableQuote,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
              </td>
            </tr>
          )}
          <tr>
            <th>Stop Loss</th>
            <td className={styles.numberCell} title="Specified stop loss">
              {formatNumber(
                position.stopLoss || 0,
                account.places,
                CURRENCY_SYMBOLS.get(position.posCurrency)
              )}
            </td>
          </tr>
          <tr>
            <th>Stop Distance</th>
            <td className={styles.numberCell} title="Stop loss distance">
              {formatNumber(
                stopLossDistance,
                account.places,
                CURRENCY_SYMBOLS.get(position.posCurrency)
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
                <b>{formatNumber(quantity, 2)}</b>
              ) : (
                "0"
              )}
            </td>
          </tr>
          {stopLossDistance !== 0 && (
            <>
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
                  {formatNumber(
                    (margin / account.amount) * 100,
                    2,
                    undefined,
                    "%"
                  )}
                </td>
              </tr>
            </>
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
      className={
        typeof position.stopLoss === "number"
          ? styles.gridWithLoss
          : styles.gridNoLoss
      }
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
