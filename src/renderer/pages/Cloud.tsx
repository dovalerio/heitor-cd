import React from 'react';
import styles from './Cloud.module.css';

export const Cloud: React.FC = () => {
  return (
    <main className={styles.page} aria-label="Cloud — Gerenciamento EKS">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">☁️</div>
        <h1 className={styles.title}>Cloud / EKS</h1>
        <p className={styles.description}>
          O gerenciamento de clusters AWS EKS está em desenvolvimento.
        </p>
        <ul className={styles.featureList} aria-label="Funcionalidades previstas">
          <li>Listar e alternar entre clusters EKS</li>
          <li>Visualizar Pods, Deployments e Services</li>
          <li>Autenticação AWS com múltiplos perfis</li>
          <li>Integração com kubectl</li>
          <li>Logs de pods em tempo real</li>
        </ul>
        <p className={styles.note}>
          Consulte <code>POST_MVP.md</code> para o roadmap completo de implementação.
        </p>
      </div>
    </main>
  );
};
