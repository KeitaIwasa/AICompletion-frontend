import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "./ui/button";
import { Textarea } from './ui/textarea';
import { RefreshCw, Copy, Check } from "lucide-react"
import { LoaderCircle } from 'lucide-react';
import axios from 'axios';  // axiosをインポート

// AI予測のバックエンド呼び出し関数
const getAIPrediction = async (text: string): Promise<string> => {
  try {
    const response = await axios.post('https://aicomletion.de.r.appspot.com/api/predict', { text });  // バックエンドのエンドポイントにリクエスト
    return response.data.prediction;
  } catch (error) {
    console.error('Error with AI prediction:', error);
    return '';
  }
};

export default function AITextInterpolation() {
  const [inputText, setInputText] = useState('');
  const [predictedText, setPredictedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false); // コピー状態を管理
  const [textareaWidth, setTextareaWidth] = useState(0); // textareaの幅を管理
  const [scrollbarWidth, setScrollbarWidth] = useState(0); // スクロールバーの横幅を管理
  const [textareaHeight, setTextareaHeight] = useState(0); // textareaの高さを管理
  const requestIdRef = useRef(0);


  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // タイピング停止後0.4秒で予測を行う
  useEffect(() => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    const handler = setTimeout(() => {
      const fetchPrediction = async () => {
        if (inputText.length > 3) {
          setLoading(true);
          const textToSend = inputText.length <= 200 ? inputText : inputText.slice(-200);
          const response = await axios.post('https://aicomletion.de.r.appspot.com/api/predict', { text: textToSend });
          const prediction = response.data.prediction;
          if (currentRequestId === requestIdRef.current) {
            setPredictedText(prediction);
            setLoading(false);
          }
        } else {
          setPredictedText('');
          setLoading(false);
        }
      };

      fetchPrediction();
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [inputText]);

  // テキストエリアと予測テキストのスクロールを同期
  useEffect(() => {
    const handleScroll = () => {
      if (overlayRef.current && textareaRef.current) {
        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
        overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (textarea) {
        textarea.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // textareaの幅と高さ、スクロールバーの横幅を取得し、divの横幅と高さを動的に更新
  useEffect(() => {
    const updateDimensions = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        // textareaの幅と高さを取得
        setTextareaWidth(textarea.offsetWidth);
        setTextareaHeight(textarea.offsetHeight);

        // スクロールバーの幅を計算
        const outer = document.createElement('div');
        outer.style.position = 'absolute';
        outer.style.top = '-9999px';
        outer.style.width = '100px';
        outer.style.height = '100px';
        outer.style.overflow = 'scroll';
        document.body.appendChild(outer);
        const scrollbarWidth = outer.offsetWidth - outer.clientWidth;
        document.body.removeChild(outer);

        setScrollbarWidth(scrollbarWidth);
      }
    };

    // 初期のサイズ計算
    updateDimensions();

    // ウィンドウリサイズ時やtextareaのリサイズ時に幅と高さを更新
    window.addEventListener('resize', updateDimensions);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('input', updateDimensions);
      textarea.addEventListener('mouseup', updateDimensions); // リサイズ後に更新
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (textarea) {
        textarea.removeEventListener('input', updateDimensions);
        textarea.removeEventListener('mouseup', updateDimensions); // クリーンアップ
      }
    };
  }, []);

  // 予測結果を適用する
  const applyPrediction = useCallback(() => {
    setInputText((prevInputText) => prevInputText + predictedText);
    setPredictedText('');
    
    // 補完適用後にテキストエリアにフォーカスを戻す
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [predictedText]);

  // リトライ機能
  const retryPrediction = useCallback(async () => {
    if (inputText.length > 5) {
      setLoading(true);
      const textToSend = inputText;
      const prediction = await getAIPrediction(textToSend);
      setPredictedText(prediction);
      setLoading(false);
    }
  }, [inputText]);

  // テキストをクリップボードにコピー
  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inputText)
        .then(() => {
          setCopied(true); // コピー成功時にアイコンを変更
          setTimeout(() => setCopied(false), 2000); // 2秒後にアイコンを元に戻す
        })
        .catch((err) => {
          console.error('Error copying text: ', err);
        });
    } else {
      alert('このブラウザではコピーがサポートされていません。');
    }
  };

  // キーボードショートカットの処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      // 予測を適用
      applyPrediction();
      e.preventDefault();
    } else if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
      // リトライ
      retryPrediction();
      e.preventDefault();
    }
  };

  // ユーザー入力の際に予測テキストをクリアする
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setPredictedText(''); // 入力時に予測テキストをクリア
    setLoading(false);    // ローディング状態をリセット
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">AI 文章補完</h1>
      <div style={{ position: 'relative' }}>
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="文章を入力してください..."
          style={{ 
            width: '100%', 
            height: '220px', 
            resize: 'vertical',
            paddingBottom: '4.5rem',
            scrollbarGutter: 'stable', // スクロールバーの位置を自動調整            
          }}  // 高さの調整を許可
          className="p-2 border rounded"
        />
        {/* 予測テキストを表示するオーバーレイ */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${textareaWidth - scrollbarWidth}px`, // スクロールバーの横幅を差し引く
            height: `${textareaHeight}px`, // テキストエリアの高さに一致
            pointerEvents: 'none',  // ユーザーの入力をブロック
            overflow: 'hidden',
            paddingBottom: '4.5rem',
            borderColor: 'transparent',
          }}
          className="p-2 border rounded"
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: 'transparent',
            }}
          >
            {inputText}
            {loading && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: '#888',
                  verticalAlign: 'middle',
                }}
              >
                <LoaderCircle
                  className="animate-spin"
                  size={16}
                  style={{ verticalAlign: 'middle', marginTop: '-5px' }} // 上下の中央に配置
                />
              </span>
            )}
            {!loading && predictedText && (
              <span
                style={{
                  color: '#484848',
                  pointerEvents: 'auto',  // クリックイベントを許可
                  background: '#E8E8E8',
                  borderRadius: '4px',
                }}
                onClick={applyPrediction}
              >
                {predictedText}
              </span>
            )}
          </pre>
        </div>
      </div>  
      <div className="flex justify-end items-center mt-4 space-x-2">
        {/* コピー機能を追加 */}
        <Button
          onClick={copyToClipboard}
          className="p-2 bg-gray-400 text-gray-600 rounded hover:bg-gray-500 transition"
          title = "コピー"
        >
          {copied ? <Check /> : <Copy />}
        </Button>

        {/* リトライボタン */}
        <Button
          onClick={retryPrediction}
          className="p-2 bg-gray-400 text-gray-600 rounded hover:bg-gray-500 transition"
          title="リトライ"
        >
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
}





