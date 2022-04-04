import React, { FC } from "react";
import { Currency, CURRENCY_SYMBOLS } from "../../../lib/tools/forex";
import Card from "../../Card";
import CurrencySelect from "../../CurrencySelect";
import FloatingLabel from "../../FloatingLabel";
import Grid from "../../Grid";
import NumberInput from "../../NumberInput";
import { useAccount } from "../AccountProvider";

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
            places={2}
            onChange={onAmountChange}
          />
        </FloatingLabel>
        <Grid columns={2} columnGap={2}>
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
      </Grid>
    </Card>
  );
};

export default AccountInfoPanel;
