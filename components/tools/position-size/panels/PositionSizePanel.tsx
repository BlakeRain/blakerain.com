import React, { FC } from "react";
import cn from "classnames";
import { CURRENCY_SYMBOLS } from "../../../../lib/tools/position-size/forex";
import {
  computedStopLossQuantity,
  computePositionSize,
  computeStopLoss,
} from "../../../../lib/tools/position-size/position";
import { formatNumber } from "../../../../lib/utils";
import Card from "../../../display/Card";
import Grid from "../../../display/Grid";
import Tooltip from "../../../display/Tooltip";
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
              <Tooltip position="left">
                Amount of account available under margin risk
              </Tooltip>
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
                <Tooltip position="left">
                  Available account under margin risk in the position currency
                </Tooltip>
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
                <Tooltip position="left">
                  Available account under margin risk in the quote currency
                </Tooltip>
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
              <Tooltip position="left">
                Available amount with a{" "}
                {formatNumber(position.margin * 100, 2, undefined, "%")}{" "}
                position margin
              </Tooltip>
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
                <Tooltip position="left">
                  Available amount with a{" "}
                  {formatNumber(position.margin * 100, 2, undefined, "%")}{" "}
                  position margin converted to position currency
                </Tooltip>
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
                <Tooltip position="left">
                  Available amount with a{" "}
                  {formatNumber(position.margin * 100, 2, undefined, "%")}{" "}
                  position margin converted to quote currency
                </Tooltip>
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
              <Tooltip position="left">
                Position size that can be taken at an open price of{" "}
                {formatNumber(
                  position.openPrice,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}{" "}
                with available margin of{" "}
                {formatNumber(
                  marginQuote,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
              </Tooltip>
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
                  <Tooltip position="left">
                    Quantity entered into position form
                  </Tooltip>
                </td>
              </tr>
              <tr>
                <th>Actual Cost</th>
                <td className={styles.numberCell}>
                  {formatNumber(
                    (position.quantity || 0) * position.openPrice,
                    account.places,
                    CURRENCY_SYMBOLS.get(position.quoteCurrency)
                  )}
                  <Tooltip position="left">
                    Cost of opening the position of{" "}
                    {formatNumber(position.quantity || 0, 2)} units at{" "}
                    {formatNumber(
                      position.openPrice,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.quoteCurrency)
                    )}
                  </Tooltip>
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
                    CURRENCY_SYMBOLS.get(position.quoteCurrency)
                  )}
                  <Tooltip position="left">
                    Amount required at{" "}
                    {formatNumber(position.margin * 100, 2, undefined, "%")}{" "}
                    position margin (
                    {formatNumber(
                      1.0 / (position.margin || 1),
                      0,
                      undefined,
                      "x"
                    )}{" "}
                    leverage)
                  </Tooltip>
                </td>
              </tr>
              {position.quoteCurrency !== position.posCurrency && (
                <tr>
                  <td className={styles.numberCell}>
                    {formatNumber(
                      actual.costPos,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.posCurrency)
                    )}
                    <Tooltip position="left">
                      Amount required at{" "}
                      {formatNumber(position.margin * 100, 2, undefined, "%")}{" "}
                      margin, converted into the position currency.
                    </Tooltip>
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
                    <Tooltip position="left">
                      Amount required at{" "}
                      {formatNumber(position.margin * 100, 2, undefined, "%")}{" "}
                      margin, converted into the account currency.
                    </Tooltip>
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
                  <Tooltip position="left">
                    The percentage of the account that will be committed as
                    margin to open the position
                  </Tooltip>
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
              <Tooltip position="left">
                Amount of account available under position risk of{" "}
                {formatNumber(account.positionRisk * 100, 2, undefined, "%")}
              </Tooltip>
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
                <Tooltip position="left">
                  Available account under position risk of{" "}
                  {formatNumber(account.positionRisk * 100, 2, undefined, "%")}{" "}
                  in the position currency
                </Tooltip>
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
                <Tooltip position="left">
                  Available account under position risk of{" "}
                  {formatNumber(account.positionRisk * 100, 2, undefined, "%")}{" "}
                  in the quote currency
                </Tooltip>
              </td>
            </tr>
          )}
          <tr>
            <th>Stop Loss Distance</th>
            <td className={styles.numberCell}>
              {formatNumber(
                distance,
                account.places,
                CURRENCY_SYMBOLS.get(position.quoteCurrency)
              )}
              <Tooltip position="left">
                The maximum stop loss distance for a position of{" "}
                {formatNumber(quantity, 2, undefined, " units")} at{" "}
                {formatNumber(
                  position.openPrice,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}{" "}
                to remain within the position risk of{" "}
                {formatNumber(account.positionRisk * 100, 2, undefined, "%")} of
                the account
              </Tooltip>
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
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
                <Tooltip position="left">
                  The maximum stop loss for a position of{" "}
                  {formatNumber(quantity, 2, undefined, " units")} at{" "}
                  {formatNumber(
                    position.openPrice,
                    account.places,
                    CURRENCY_SYMBOLS.get(position.quoteCurrency)
                  )}{" "}
                  to remain within the position risk of{" "}
                  {formatNumber(account.positionRisk * 100, 2, undefined, "%")}{" "}
                  of the account
                </Tooltip>
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
                  <Tooltip position="left">
                    The distance provided in the position form
                  </Tooltip>
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
                  <Tooltip position="left">
                    The actual account loss that will be incurred should the
                    position close at the provided stop loss position of{" "}
                    {formatNumber(
                      position.stopLoss || 0,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.quoteCurrency)
                    )}
                  </Tooltip>
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
                  <Tooltip position="left">
                    Percentage of account at risk for the provided stop loss
                    position of{" "}
                    {formatNumber(
                      position.stopLoss || 0,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.quoteCurrency)
                    )}
                  </Tooltip>
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
            <td className={styles.numberCell}>
              {formatNumber(
                available,
                account.places,
                CURRENCY_SYMBOLS.get(account.currency)
              )}
              <Tooltip position="left">
                Amount of account available under position risk of{" "}
                {formatNumber(account.positionRisk * 100, 2, undefined, "%")}
              </Tooltip>
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
                <Tooltip position="left">
                  Available account under position risk of{" "}
                  {formatNumber(account.positionRisk * 100, 2, undefined, "%")}{" "}
                  in the position currency
                </Tooltip>
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
                <Tooltip position="left">
                  Available account under position risk of{" "}
                  {formatNumber(account.positionRisk * 100, 2, undefined, "%")}{" "}
                  in the quote currency
                </Tooltip>
              </td>
            </tr>
          )}
          <tr>
            <th>Stop Loss</th>
            <td className={styles.numberCell}>
              {formatNumber(
                position.stopLoss || 0,
                account.places,
                CURRENCY_SYMBOLS.get(position.quoteCurrency)
              )}
              <Tooltip position="left">
                Stop loss entered in position form.
              </Tooltip>
            </td>
          </tr>
          <tr>
            <th>Stop Distance</th>
            <td className={styles.numberCell}>
              {formatNumber(
                stopLossDistance,
                account.places,
                CURRENCY_SYMBOLS.get(position.quoteCurrency)
              )}
              <Tooltip position="left">
                Stop loss distance entered into position form.
              </Tooltip>
            </td>
          </tr>
          <tr>
            <th>Available Quantity</th>
            <td className={styles.numberCell}>
              {stopLossDistance !== 0 ? (
                <b>{formatNumber(quantity, 2)}</b>
              ) : (
                "0"
              )}
              <Tooltip position="left">
                The position size that can be taken at an open price of{" "}
                {formatNumber(
                  position.openPrice,
                  account.places,
                  CURRENCY_SYMBOLS.get(position.quoteCurrency)
                )}
                , given an account position risk of{" "}
                {formatNumber(account.positionRisk * 100, 2, undefined, "%")}
              </Tooltip>
            </td>
          </tr>
          {stopLossDistance !== 0 && (
            <>
              <tr>
                <th rowSpan={2}>Required Margin</th>
                <td className={styles.numberCell}>
                  {formatNumber(
                    margin,
                    account.places,
                    CURRENCY_SYMBOLS.get(account.currency)
                  )}
                  <Tooltip position="left">
                    The amount of account margin that will be committed to
                    opening a position of{" "}
                    {formatNumber(quantity, 2, undefined, " units")} at{" "}
                    {formatNumber(
                      position.openPrice,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.quoteCurrency)
                    )}{" "}
                    with a position margin of{" "}
                    {formatNumber(position.margin * 100, 2, undefined, "%")} (
                    {formatNumber(1 / position.margin, 0, undefined, "x")}{" "}
                    leverage)
                  </Tooltip>
                </td>
              </tr>
              <tr>
                <td className={styles.numberCell}>
                  {formatNumber(
                    (margin / account.amount) * 100,
                    2,
                    undefined,
                    "%"
                  )}
                  <Tooltip position="left">
                    The amount of account margin, as a percentage of the account
                    value, that will be committed to opening a position of{" "}
                    {formatNumber(quantity, 2, undefined, " units")} at{" "}
                    {formatNumber(
                      position.openPrice,
                      account.places,
                      CURRENCY_SYMBOLS.get(position.quoteCurrency)
                    )}{" "}
                    with a position margin of{" "}
                    {formatNumber(position.margin * 100, 2, undefined, "%")} (
                    {formatNumber(1 / position.margin, 0, undefined, "x")}{" "}
                    leverage)
                  </Tooltip>
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
