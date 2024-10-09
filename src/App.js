import React, { useEffect } from 'react';
import axios from 'axios';
import AITextInterpolation from './components/AITextInterpolation';

function App() {
  // APIからデータを取得する関数
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/'); // バックエンドのAPIエンドポイント
      console.log(response.data); // 取得したデータをコンソールに表示
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // コンポーネントがマウントされたときにfetchDataを呼び出す
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <AITextInterpolation />
    </div>
  );
}

export default App;

