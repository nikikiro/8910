import type { BallType } from "../tournaments/types";
import styles from "./BallPip.module.css";

export function BallPip({ type, size = 28 }: { type: BallType; size?: number }) {
  const striped = type === 9 || type === 10;
  const style = {
    "--ball-size": `${size}px`,
    "--ball-color": `var(--color-ball-${type})`,
  } as React.CSSProperties;

  return (
    <span className={`${styles.ball} ${striped ? styles.striped : ""}`} style={style} aria-hidden="true">
      <span className={styles.center}>{type}</span>
    </span>
  );
}
