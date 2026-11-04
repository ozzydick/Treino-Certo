/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MEDIA_DB_NAME = 'fit_app_media_db';
export const MEDIA_DB_VERSION = 1;
export const MEDIA_STORE_NAME = 'equipment_photos';

export interface EquipmentPhotoRecord {
  equipmentId: string;
  dataUrl: string;
  mimeType?: string;
  updatedAt: string;
}

export class MediaDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private customIndexedDB: IDBFactory | null = null;

  constructor(customFactory?: IDBFactory) {
    if (customFactory) {
      this.customIndexedDB = customFactory;
    }
  }

  public setFactory(factory: IDBFactory): void {
    this.customIndexedDB = factory;
    this.closeConnection();
  }

  public closeConnection(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }

  private getFactory(): IDBFactory {
    if (this.customIndexedDB) {
      return this.customIndexedDB;
    }
    if (typeof window !== 'undefined' && window.indexedDB) {
      return window.indexedDB;
    }
    if (typeof indexedDB !== 'undefined') {
      return indexedDB;
    }
    throw new Error('IndexedDB não está disponível no ambiente de execução.');
  }

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const factory = this.getFactory();
        const request = factory.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
            db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'equipmentId' });
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.db.onversionchange = () => {
            if (this.db) {
              this.db.close();
              this.db = null;
              this.initPromise = null;
            }
          };
          resolve(this.db);
        };

        request.onerror = () => {
          this.initPromise = null;
          reject(request.error || new Error('Falha ao abrir fit_app_media_db.'));
        };

        request.onblocked = () => {
          console.warn('[MediaDB] Abertura do banco de mídias bloqueada.');
        };
      } catch (err) {
        this.initPromise = null;
        reject(err);
      }
    });

    return this.initPromise;
  }

  public _testFaultInjector?: (
    operation: 'getAll' | 'get' | 'save' | 'delete' | 'clear' | 'saveAll' | 'saveAll_sync'
  ) => boolean;

  public lastTransactionLog: {
    operation: string;
    txStarted: boolean;
    abortRequested: boolean;
    onAbortFired: boolean;
    onCompleteFired: boolean;
    onErrorFired: boolean;
    settledVia: 'oncomplete' | 'onabort' | null;
    eventsOrder: string[];
  } | null = null;

  public setTestFaultInjector(
    fn?: (
      operation: 'getAll' | 'get' | 'save' | 'delete' | 'clear' | 'saveAll' | 'saveAll_sync'
    ) => boolean
  ): void {
    this._testFaultInjector = fn;
  }

  public getLastTransactionLog() {
    return this.lastTransactionLog;
  }

  private createTransactionLog(operation: string) {
    const log = {
      operation,
      txStarted: false,
      abortRequested: false,
      onAbortFired: false,
      onCompleteFired: false,
      onErrorFired: false,
      settledVia: null as 'oncomplete' | 'onabort' | null,
      eventsOrder: [] as string[],
    };
    this.lastTransactionLog = log;
    return log;
  }

  /**
   * Salva ou atualiza a foto associada a um equipamento.
   * - tx.oncomplete é o único evento que confirma sucesso.
   * - Erros de request, transação ou exceções síncronas registram a causa original e solicitam tx.abort().
   * - A Promise é rejeitada exclusivamente no evento tx.onabort.
   */
  public async savePhoto(
    equipmentId: string,
    dataUrl: string,
    mimeType = 'image/jpeg'
  ): Promise<void> {
    if (!equipmentId || !dataUrl) return;
    const db = await this.getDB();

    const record: EquipmentPhotoRecord = {
      equipmentId,
      dataUrl,
      mimeType,
      updatedAt: new Date().toISOString(),
    };

    const log = this.createTransactionLog('savePhoto');

    return new Promise<void>((resolve, reject) => {
      let isSettled = false;
      let isFinished = false;
      let abortRequested = false;
      let originalCause: Error | null = null;

      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      log.txStarted = true;
      log.eventsOrder.push('tx_started');

      const requestAbort = (cause: unknown) => {
        const err =
          cause instanceof Error
            ? cause
            : new Error(cause ? String(cause) : 'Erro ao salvar foto do equipamento.');
        if (!originalCause) {
          originalCause = err;
        }
        if (!isFinished && !isSettled && !abortRequested) {
          abortRequested = true;
          log.abortRequested = true;
          log.eventsOrder.push('abort_requested');
          try {
            tx.abort();
          } catch {
            // A transação já pode estar em processo de aborto ou encerrada
          }
        }
      };

      tx.oncomplete = () => {
        isFinished = true;
        log.onCompleteFired = true;
        log.eventsOrder.push('tx_oncomplete');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'oncomplete';
          resolve();
        }
      };

      tx.onerror = (event) => {
        log.onErrorFired = true;
        log.eventsOrder.push('tx_onerror');
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        requestAbort(tx.error || new Error('Erro na transação ao salvar foto do equipamento.'));
      };

      tx.onabort = () => {
        isFinished = true;
        log.onAbortFired = true;
        log.eventsOrder.push('tx_onabort');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'onabort';
          const rejectionError =
            originalCause ||
            tx.error ||
            new Error('Transação de gravação de foto abortada.');
          reject(rejectionError);
        }
      };

      try {
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const req = store.put(record);

        req.onerror = (event) => {
          log.eventsOrder.push('req_onerror');
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          requestAbort(
            req.error || new Error('Erro na requisição ao salvar foto do equipamento.')
          );
        };

        if (this._testFaultInjector && this._testFaultInjector('save')) {
          requestAbort(new Error('Falha induzida na gravação de foto em fit_app_media_db.'));
        }
      } catch (err) {
        log.eventsOrder.push('sync_catch');
        requestAbort(err);
      }
    });
  }

  /**
   * Obtém a foto (Data URL) associada ao ID do equipamento.
   * Aguarda o encerramento formal da transação readonly (tx.oncomplete).
   */
  public async getPhoto(equipmentId: string): Promise<string | null> {
    if (!equipmentId) return null;
    const db = await this.getDB();
    const log = this.createTransactionLog('getPhoto');

    return new Promise<string | null>((resolve, reject) => {
      let isSettled = false;
      let isFinished = false;
      let abortRequested = false;
      let originalCause: Error | null = null;
      let photoResult: string | null = null;

      const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
      log.txStarted = true;
      log.eventsOrder.push('tx_started');

      const requestAbort = (cause: unknown) => {
        const err =
          cause instanceof Error
            ? cause
            : new Error(cause ? String(cause) : 'Erro ao buscar foto do equipamento.');
        if (!originalCause) {
          originalCause = err;
        }
        if (!isFinished && !isSettled && !abortRequested) {
          abortRequested = true;
          log.abortRequested = true;
          log.eventsOrder.push('abort_requested');
          try {
            tx.abort();
          } catch {
            // A transação já pode estar em processo de aborto ou encerrada
          }
        }
      };

      tx.oncomplete = () => {
        isFinished = true;
        log.onCompleteFired = true;
        log.eventsOrder.push('tx_oncomplete');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'oncomplete';
          resolve(photoResult);
        }
      };

      tx.onerror = (event) => {
        log.onErrorFired = true;
        log.eventsOrder.push('tx_onerror');
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        requestAbort(tx.error || new Error('Erro na transação ao buscar foto do equipamento.'));
      };

      tx.onabort = () => {
        isFinished = true;
        log.onAbortFired = true;
        log.eventsOrder.push('tx_onabort');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'onabort';
          reject(
            originalCause || tx.error || new Error('Transação de leitura de foto abortada.')
          );
        }
      };

      try {
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const req = store.get(equipmentId);

        req.onsuccess = () => {
          log.eventsOrder.push('req_onsuccess');
          const result = req.result as EquipmentPhotoRecord | undefined;
          photoResult = result?.dataUrl || null;
        };

        req.onerror = (event) => {
          log.eventsOrder.push('req_onerror');
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          requestAbort(req.error || new Error('Erro ao buscar foto do equipamento.'));
        };

        if (this._testFaultInjector && this._testFaultInjector('get')) {
          requestAbort(new Error('Falha induzida na leitura unitária de fit_app_media_db.'));
        }
      } catch (err) {
        log.eventsOrder.push('sync_catch');
        requestAbort(err);
      }
    });
  }

  /**
   * Remove a foto associada a um equipamento.
   * - tx.oncomplete é o único evento que confirma sucesso.
   * - A Promise somente é rejeitada no evento tx.onabort.
   */
  public async deletePhoto(equipmentId: string): Promise<void> {
    if (!equipmentId) return;
    const db = await this.getDB();
    const log = this.createTransactionLog('deletePhoto');

    return new Promise<void>((resolve, reject) => {
      let isSettled = false;
      let isFinished = false;
      let abortRequested = false;
      let originalCause: Error | null = null;

      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      log.txStarted = true;
      log.eventsOrder.push('tx_started');

      const requestAbort = (cause: unknown) => {
        const err =
          cause instanceof Error
            ? cause
            : new Error(cause ? String(cause) : 'Erro ao deletar foto do equipamento.');
        if (!originalCause) {
          originalCause = err;
        }
        if (!isFinished && !isSettled && !abortRequested) {
          abortRequested = true;
          log.abortRequested = true;
          log.eventsOrder.push('abort_requested');
          try {
            tx.abort();
          } catch {
            // A transação já pode estar em processo de aborto ou encerrada
          }
        }
      };

      tx.oncomplete = () => {
        isFinished = true;
        log.onCompleteFired = true;
        log.eventsOrder.push('tx_oncomplete');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'oncomplete';
          resolve();
        }
      };

      tx.onerror = (event) => {
        log.onErrorFired = true;
        log.eventsOrder.push('tx_onerror');
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        requestAbort(tx.error || new Error('Erro na transação ao deletar foto do equipamento.'));
      };

      tx.onabort = () => {
        isFinished = true;
        log.onAbortFired = true;
        log.eventsOrder.push('tx_onabort');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'onabort';
          reject(
            originalCause || tx.error || new Error('Transação de exclusão de foto abortada.')
          );
        }
      };

      try {
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const req = store.delete(equipmentId);

        req.onerror = (event) => {
          log.eventsOrder.push('req_onerror');
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          requestAbort(
            req.error || new Error('Erro na requisição ao deletar foto do equipamento.')
          );
        };

        if (this._testFaultInjector && this._testFaultInjector('delete')) {
          requestAbort(new Error('Falha induzida na exclusão de foto em fit_app_media_db.'));
        }
      } catch (err) {
        log.eventsOrder.push('sync_catch');
        requestAbort(err);
      }
    });
  }

  /**
   * Retorna um mapa contendo todas as fotos armazenadas: { [equipmentId]: dataUrl }.
   * A leitura somente é considerada concluída no encerramento formal da transação readonly (tx.oncomplete).
   */
  public async getAllPhotos(): Promise<Record<string, string>> {
    const db = await this.getDB();
    const log = this.createTransactionLog('getAllPhotos');

    return new Promise<Record<string, string>>((resolve, reject) => {
      let isSettled = false;
      let isFinished = false;
      let abortRequested = false;
      let originalCause: Error | null = null;
      let collectedMap: Record<string, string> = {};

      const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
      log.txStarted = true;
      log.eventsOrder.push('tx_started');

      const requestAbort = (cause: unknown) => {
        const err =
          cause instanceof Error
            ? cause
            : new Error(cause ? String(cause) : 'Erro ao listar fotos de equipamentos.');
        if (!originalCause) {
          originalCause = err;
        }
        if (!isFinished && !isSettled && !abortRequested) {
          abortRequested = true;
          log.abortRequested = true;
          log.eventsOrder.push('abort_requested');
          try {
            tx.abort();
          } catch {
            // A transação já pode estar em processo de aborto ou encerrada
          }
        }
      };

      tx.oncomplete = () => {
        isFinished = true;
        log.onCompleteFired = true;
        log.eventsOrder.push('tx_oncomplete');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'oncomplete';
          resolve(collectedMap);
        }
      };

      tx.onerror = (event) => {
        log.onErrorFired = true;
        log.eventsOrder.push('tx_onerror');
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        requestAbort(tx.error || new Error('Erro na transação ao listar fotos de equipamentos.'));
      };

      tx.onabort = () => {
        isFinished = true;
        log.onAbortFired = true;
        log.eventsOrder.push('tx_onabort');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'onabort';
          reject(
            originalCause || tx.error || new Error('Transação de leitura de fotos abortada.')
          );
        }
      };

      try {
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          log.eventsOrder.push('req_onsuccess');
          const records = (req.result || []) as EquipmentPhotoRecord[];
          const map: Record<string, string> = {};
          for (const rec of records) {
            if (rec.equipmentId && rec.dataUrl) {
              map[rec.equipmentId] = rec.dataUrl;
            }
          }
          collectedMap = map;
        };

        req.onerror = (event) => {
          log.eventsOrder.push('req_onerror');
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          requestAbort(req.error || new Error('Erro ao listar fotos de equipamentos.'));
        };

        if (this._testFaultInjector && this._testFaultInjector('getAll')) {
          requestAbort(new Error('Falha na leitura do banco de mídias fit_app_media_db.'));
        }
      } catch (err) {
        log.eventsOrder.push('sync_catch');
        requestAbort(err);
      }
    });
  }

  /**
   * Salva em lote um conjunto de fotos (usado na restauração de backup e compensação).
   * - tx.oncomplete é o único evento que confirma sucesso.
   * - Exceções síncronas ou falhas de requisição/transação acionam tx.abort() e aguardam tx.onabort.
   */
  public async saveAllPhotos(photosMap: Record<string, string>): Promise<void> {
    const db = await this.getDB();
    const entries = Object.entries(photosMap);
    const log = this.createTransactionLog('saveAllPhotos');

    return new Promise<void>((resolve, reject) => {
      let isSettled = false;
      let isFinished = false;
      let abortRequested = false;
      let originalCause: Error | null = null;

      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      log.txStarted = true;
      log.eventsOrder.push('tx_started');

      const requestAbort = (cause: unknown) => {
        const err =
          cause instanceof Error
            ? cause
            : new Error(cause ? String(cause) : 'Erro na transação ao salvar lote de fotos.');
        if (!originalCause) {
          originalCause = err;
        }
        if (!isFinished && !isSettled && !abortRequested) {
          abortRequested = true;
          log.abortRequested = true;
          log.eventsOrder.push('abort_requested');
          try {
            tx.abort();
          } catch {
            // A transação já pode estar em processo de aborto ou encerrada
          }
        }
      };

      tx.oncomplete = () => {
        isFinished = true;
        log.onCompleteFired = true;
        log.eventsOrder.push('tx_oncomplete');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'oncomplete';
          resolve();
        }
      };

      tx.onerror = (event) => {
        log.onErrorFired = true;
        log.eventsOrder.push('tx_onerror');
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        requestAbort(tx.error || new Error('Erro na transação ao salvar lote de fotos.'));
      };

      tx.onabort = () => {
        isFinished = true;
        log.onAbortFired = true;
        log.eventsOrder.push('tx_onabort');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'onabort';
          reject(
            originalCause || tx.error || new Error('Transação de gravação de fotos abortada.')
          );
        }
      };

      try {
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const clearReq = store.clear();
        clearReq.onerror = (event) => {
          log.eventsOrder.push('clear_req_onerror');
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          requestAbort(
            clearReq.error || new Error('Erro ao limpar fotos antes da gravação em lote.')
          );
        };

        if (this._testFaultInjector && this._testFaultInjector('saveAll_sync')) {
          throw new Error(
            'Erro síncrono induzido durante o enfileiramento de saveAllPhotos em fit_app_media_db.'
          );
        }

        for (const [equipmentId, dataUrl] of entries) {
          if (equipmentId && dataUrl) {
            const putReq = store.put({
              equipmentId,
              dataUrl,
              updatedAt: new Date().toISOString(),
            });
            putReq.onerror = (event) => {
              log.eventsOrder.push('put_req_onerror');
              if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
              }
              requestAbort(
                putReq.error || new Error(`Erro ao gravar foto do equipamento "${equipmentId}".`)
              );
            };
          }
        }

        if (
          this._testFaultInjector &&
          (this._testFaultInjector('save') || this._testFaultInjector('saveAll'))
        ) {
          requestAbort(
            new Error('Falha na gravação em lote no banco de mídias fit_app_media_db.')
          );
        }
      } catch (err) {
        log.eventsOrder.push('sync_catch');
        requestAbort(err);
      }
    });
  }

  /**
   * Limpa todas as fotos armazenadas.
   * - tx.oncomplete é o único evento que confirma sucesso.
   * - A Promise somente é rejeitada após confirmação formal em tx.onabort.
   */
  public async clearAllPhotos(): Promise<void> {
    const db = await this.getDB();
    const log = this.createTransactionLog('clearAllPhotos');

    return new Promise<void>((resolve, reject) => {
      let isSettled = false;
      let isFinished = false;
      let abortRequested = false;
      let originalCause: Error | null = null;

      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      log.txStarted = true;
      log.eventsOrder.push('tx_started');

      const requestAbort = (cause: unknown) => {
        const err =
          cause instanceof Error
            ? cause
            : new Error(cause ? String(cause) : 'Erro ao limpar fotos de equipamentos.');
        if (!originalCause) {
          originalCause = err;
        }
        if (!isFinished && !isSettled && !abortRequested) {
          abortRequested = true;
          log.abortRequested = true;
          log.eventsOrder.push('abort_requested');
          try {
            tx.abort();
          } catch {
            // A transação já pode estar em processo de aborto ou encerrada
          }
        }
      };

      tx.oncomplete = () => {
        isFinished = true;
        log.onCompleteFired = true;
        log.eventsOrder.push('tx_oncomplete');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'oncomplete';
          resolve();
        }
      };

      tx.onerror = (event) => {
        log.onErrorFired = true;
        log.eventsOrder.push('tx_onerror');
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        requestAbort(
          tx.error || new Error('Erro na transação ao limpar fotos de equipamentos.')
        );
      };

      tx.onabort = () => {
        isFinished = true;
        log.onAbortFired = true;
        log.eventsOrder.push('tx_onabort');
        if (!isSettled) {
          isSettled = true;
          log.settledVia = 'onabort';
          reject(
            originalCause || tx.error || new Error('Transação de limpeza de fotos abortada.')
          );
        }
      };

      try {
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const req = store.clear();

        req.onerror = (event) => {
          log.eventsOrder.push('req_onerror');
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          requestAbort(
            req.error || new Error('Erro na requisição ao limpar fotos de equipamentos.')
          );
        };

        if (this._testFaultInjector && this._testFaultInjector('clear')) {
          requestAbort(new Error('Falha na limpeza do banco de mídias fit_app_media_db.'));
        }
      } catch (err) {
        log.eventsOrder.push('sync_catch');
        requestAbort(err);
      }
    });
  }
}

// Instância singleton padrão para o aplicativo
export const mediaDB = new MediaDB();

/**
 * Utilitário para redimensionar e comprimir imagens antes do armazenamento local,
 * mantendo o aplicativo ultrarrápido e sem estourar o armazenamento do navegador.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se não estiver em ambiente de navegador com Image e Canvas, lê diretamente via FileReader
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Image === 'undefined') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar imagem para visualização.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          // Fallback para dataUrl original caso toDataURL falhe
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
