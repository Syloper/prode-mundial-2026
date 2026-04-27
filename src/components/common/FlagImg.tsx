import React from "react";
import { FLAG_CDN_CODES } from "../../utils/teamFlags";

interface Props {
  flag: string;
  size?: number;
}

export const FlagImg: React.FC<Props> = ({ flag, size = 20 }) => {
  const code = FLAG_CDN_CODES[flag];
  if (!code) return <span>{flag}</span>;
  return (
    <img
      src={`https://flagcdn.com/w${size}/${code}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${code}.png 2x`}
      width={size}
      alt={flag}
      style={{ verticalAlign: "middle", display: "inline-block" }}
    />
  );
};
