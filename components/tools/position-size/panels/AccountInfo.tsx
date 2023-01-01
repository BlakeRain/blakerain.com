import React, { FC } from "react";
import { Currency, CURRENCY_SYMBOLS } from "../../../../lib/tools/position-size/forex";
import Card from "../../../display/Card";
import CurrencySelect from "../../../fields/CurrencySelect";
import FloatingLabel from "../../../display/FloatingLabel";
import Grid from "../../../display/Grid";
import NumberInput from "../../../fields/NumberInput";
import { useAccount } from "../AccountProvider";
import styles from "./AccountInfo.module.scss";

export const AccountInfoPanel: FC = () => {
  const { account, dispatch } = useAccount();

  const onCurrencyChange = (currency: Currency) => {
    dispatch({ action: "setCurrency", currency });
  };

  const onAmountChange = (amount: number) => {
    dispatch({ action: "setAmount", amount });
  };

  const onMarginRiskChange = (risk: number) => {
    dispatch({ action: "setMarginRisk", risk: risk / 100 });
  };

  const onPositionRiskChange = (risk: number) => {
    dispatch({ action: "setPositionRisk", risk: risk / 100 });
  };

  const onPlacesChange = (places: number) => {
    dispatch({ action: "setPlaces", places });
  };

  return (
    <Card title="Account Information">
      <Grid rowGap={2}>
        <FloatingLabel title="Account Currency">
          <CurrencySelect
            value={account.currency}
            onChange={onCurrencyChange}
          />
        </FloatingLabel>
        <FloatingLabel title="Account Value">
          <NumberInput
            value={account.amount}
            prefix={CURRENCY_SYMBOLS.get(account.currency)}
            places={account.places}
            onChange={onAmountChange}
          />
        </FloatingLabel>
        <Grid className={styles.riskGrid} columnGap={2}>
          <FloatingLabel title="Margin Risk">
            <NumberInput
              value={account.marginRisk * 100}
              places={0}
              suffix="%"
              onChange={onMarginRiskChange}
            />
          </FloatingLabel>
          <FloatingLabel title="Position Risk">
            <NumberInput
              value={account.positionRisk * 100}
              places={0}
              suffix="%"
              onChange={onPositionRiskChange}
            />
          </FloatingLabel>
        </Grid>
        <FloatingLabel title="Decimal Places">
          <NumberInput
            value={account.places}
            places={0}
            suffix=" digits"
            onChange={onPlacesChange}
          />
        </FloatingLabel>
      </Grid>
    </Card>
  );
};

export default AccountInfoPanel;
