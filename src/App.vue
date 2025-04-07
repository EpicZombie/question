<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue';

// 存储用户输入的答案文本
const answerText = ref('');
// 存储解析后的答案结构
const parsedAnswer = ref([]);
// 是否已解析
const isParsed = ref(false);
// 存储批量处理的答案列表
const batchAnswers = reactive([]);
// 当前页码
const currentPage = ref(0);
// 每页显示数量
const pageSize = ref(10);
// 是否处于批量模式
const isBatchMode = ref(false);
// 文件加载状态
const fileLoading = ref(false);
// 是否处于编辑模式
const editMode = ref(false);
// 当前正在编辑的项目
const currentEditItem = ref(null);

// 当前编辑的内容
const editContent = ref('');
// 当前编辑的标题
const editTitle = ref('');

// 计算总页数
const totalPages = computed(() => {
  if (!isBatchMode.value || batchAnswers.length === 0) return 1;
  return Math.ceil(batchAnswers.length / pageSize.value);
});

// 当前页面显示的答案
const currentPageAnswers = computed(() => {
  if (!isBatchMode.value) {
    return [{ parsed: parsedAnswer.value, index: 1 }];
  }
  
  const start = currentPage.value * pageSize.value;
  const end = Math.min(start + pageSize.value, batchAnswers.length);
  return batchAnswers.slice(start, end);
});

// 解析答案文本，将其按照大点和小点拆分
function parseAnswer(text = null) {
  const content = text || answerText.value;
  if (!content.trim()) {
    alert('请输入答案内容');
    return null;
  }

  // 首先按照大点（一、二、三等）分割文本
  const chineseNumbers = '一二三四五六七八九十';
  const regex = new RegExp(`(${chineseNumbers.split('').join('|')})、`);
  
  // 分割文本为大点
  const sections = content.split(regex);
  
  // 处理分割结果
  const result = [];
  for (let i = 1; i < sections.length; i += 2) {
    if (sections[i] && sections[i+1]) {
      const majorNumber = sections[i]; // 中文数字
      const majorContent = sections[i+1].trim();
      
      // 分割小点
      const minorRegex = /(\d+)、/g;
      const minorParts = majorContent.split(minorRegex).filter(part => part.trim());
      
      const minorPoints = [];
      for (let j = 1; j < minorParts.length; j += 2) {
        if (minorParts[j] && minorParts[j+1]) {
          const minorNumber = minorParts[j];
          const minorContent = minorParts[j+1].trim();
          
          // 分割标题和内容
          const lines = minorContent.split('\n');
          let title = '';
          let content = minorContent;
          
          // 尝试提取标题
          if (lines[0] && (lines[0].includes('：') || lines[0].includes(':'))) {
            const titleParts = lines[0].split(/[：:]/);
            if (titleParts.length >= 1) {
              title = titleParts[0].trim();
              content = [titleParts.slice(1).join(':'), ...lines.slice(1)].join('\n').trim();
            }
          }
          
          minorPoints.push({
            id: `${result.length + 1}-${minorPoints.length + 1}`,
            number: minorNumber,
            title: title || `小点 ${minorNumber}`,
            content: content,
            isOpen: true // 默认打开所有手风琴
          });
        }
      }
      
      // 提取大点标题
      const majorLines = majorContent.split('\n');
      let majorTitle = '';
      
      // 如果第一行不包含小点，可能是标题
      if (majorLines[0] && !majorLines[0].match(/\d+、/)) {
        majorTitle = majorLines[0].trim();
      }
      
      result.push({
        id: `major-${result.length + 1}`,
        number: majorNumber,
        title: majorTitle || `${majorNumber}`,
        items: minorPoints,
        isOpen: true // 默认打开所有手风琴
      });
    }
  }

  if (text) {
    return result;
  } else {
    parsedAnswer.value = result;
    isParsed.value = true;
    return result;
  }
}

// 处理文件上传
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  fileLoading.value = true;
  
  try {
    const text = await readFileAsText(file);
    // 按行分割文本
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    // 清空之前的批量答案
    batchAnswers.length = 0;
    
    // 处理每一行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        const parsedResult = parseAnswer(line);
        if (parsedResult && parsedResult.length > 0) {
          batchAnswers.push({
            raw: line,
            parsed: parsedResult,
            index: i + 1
          });
        }
      }
    }
    
    if (batchAnswers.length > 0) {
      isBatchMode.value = true;
      currentPage.value = 0; // 重置为第一页
      isParsed.value = true;
      // 确保所有手风琴都展开
      expandAllCurrentPage();
    } else {
      alert('文件中没有找到有效的答案格式');
    }
  } catch (error) {
    console.error('读取文件失败:', error);
    alert('读取文件失败: ' + error.message);
  } finally {
    fileLoading.value = false;
    // 重置文件输入框，以便于再次选择同一文件
    event.target.value = '';
  }
}

// 读取文件内容为文本
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

// 查看上一页
function viewPreviousPage() {
  if (currentPage.value > 0) {
    currentPage.value--;
    expandAllCurrentPage();
  }
}

// 查看下一页
function viewNextPage() {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++;
    expandAllCurrentPage();
  }
}

// 返回单个答案模式
function backToSingleMode() {
  isBatchMode.value = false;
  isParsed.value = false;
  answerText.value = '';
  parsedAnswer.value = [];
  batchAnswers.length = 0;
  currentPage.value = 0;
}

// 切换大点的展开/折叠状态
function toggleMajorSection(answerIndex, majorIndex) {
  if (isBatchMode.value) {
    const pageIndexOffset = currentPage.value * pageSize.value;
    const actualIndex = pageIndexOffset + answerIndex;
    batchAnswers[actualIndex].parsed[majorIndex].isOpen = !batchAnswers[actualIndex].parsed[majorIndex].isOpen;
  } else {
    parsedAnswer.value[majorIndex].isOpen = !parsedAnswer.value[majorIndex].isOpen;
  }
}

// 切换小点的展开/折叠状态
function toggleMinorSection(answerIndex, majorIndex, minorIndex) {
  if (isBatchMode.value) {
    const pageIndexOffset = currentPage.value * pageSize.value;
    const actualIndex = pageIndexOffset + answerIndex;
    batchAnswers[actualIndex].parsed[majorIndex].items[minorIndex].isOpen = !batchAnswers[actualIndex].parsed[majorIndex].items[minorIndex].isOpen;
  } else {
    parsedAnswer.value[majorIndex].items[minorIndex].isOpen = !parsedAnswer.value[majorIndex].items[minorIndex].isOpen;
  }
}

// 重置应用
function resetApp() {
  if (isBatchMode.value) {
    backToSingleMode();
  } else {
    answerText.value = '';
    parsedAnswer.value = [];
    isParsed.value = false;
  }
}

// 预填入示例
function fillExample() {
  answerText.value = `一、有独立请求权的第三人
1、定义与特点：有独立请求权的第三人是指对原告和被告争议的诉讼标的有独立的请求权，因此参加诉讼的人。他们相当于原告的角色，对诉讼标的主张全部或部分的权利。
2、诉讼地位与权利：这类第三人在诉讼中具有相当于原告的诉讼地位，可以提出诉讼请求，参与法庭辩论，并在必要时提起上诉。
二、无独立请求权的第三人
3、定义与特点：无独立请求权的第三人是指对当事人双方争议的诉讼标的没有独立请求权，但案件处理结果与其有法律上的利害关系，因此申请参加诉讼或者由人民法院通知其参加诉讼的人。
4、诉讼地位与权利：这类第三人在诉讼中依附于一方当事人，通过支持该方当事人的主张来维护自己的合法权益。他们在诉讼中具有独立诉讼地位，但并不享有完整的当事人权利，如无权提出管辖异议或放弃、变更诉讼请求。
三、法律依据与对比
5、法律依据：《中华人民共和国民事诉讼法》第五十九条规定了有独立请求权的第三人和无独立请求权的第三人的相关法律地位与权利。
6、对比：有独立请求权的第三人参加诉讼的目的在于直接解决涉及其利益的争议，可以对诉讼标的提出独立的诉讼请求；而无独立请求权的第三人参加诉讼的目的则在于保护其因案件处理结果可能受到影响的法律权益，他们的参与有助于法院全面了解案件事实，避免出现对第三方权益产生不利影响的判决。`;
}

// 展开当前页所有答案的手风琴
function expandAllCurrentPage() {
  if (isBatchMode.value) {
    currentPageAnswers.value.forEach(answer => {
      answer.parsed.forEach(majorSection => {
        majorSection.isOpen = true;
        majorSection.items.forEach(minorItem => {
          minorItem.isOpen = true;
        });
      });
    });
  } else {
    expandAll();
  }
}

// 展开所有手风琴
function expandAll() {
  if (isBatchMode.value) {
    batchAnswers.forEach(answer => {
      answer.parsed.forEach(majorSection => {
        majorSection.isOpen = true;
        majorSection.items.forEach(minorItem => {
          minorItem.isOpen = true;
        });
      });
    });
  } else {
    parsedAnswer.value.forEach(majorSection => {
      majorSection.isOpen = true;
      majorSection.items.forEach(minorItem => {
        minorItem.isOpen = true;
      });
    });
  }
}

// 折叠所有手风琴
function collapseAll() {
  if (isBatchMode.value) {
    batchAnswers.forEach(answer => {
      answer.parsed.forEach(majorSection => {
        majorSection.isOpen = false;
        majorSection.items.forEach(minorItem => {
          minorItem.isOpen = false;
        });
      });
    });
  } else {
    parsedAnswer.value.forEach(majorSection => {
      majorSection.isOpen = false;
      majorSection.items.forEach(minorItem => {
        minorItem.isOpen = false;
      });
    });
  }
}

// 启动编辑标题模式
function editMajorTitle(answerIndex, majorIndex) {
  if (editMode.value) return; // 防止多个编辑框同时打开
  
  editMode.value = true;
  
  if (isBatchMode.value) {
    const pageIndexOffset = currentPage.value * pageSize.value;
    const actualIndex = pageIndexOffset + answerIndex;
    
    currentEditItem.value = {
      type: 'majorTitle',
      answerIndex: actualIndex,
      majorIndex,
    };
    editTitle.value = batchAnswers[actualIndex].parsed[majorIndex].title;
  } else {
    currentEditItem.value = {
      type: 'majorTitle',
      majorIndex,
    };
    editTitle.value = parsedAnswer.value[majorIndex].title;
  }
}

// 启动编辑小点标题模式
function editMinorTitle(answerIndex, majorIndex, minorIndex) {
  if (editMode.value) return; // 防止多个编辑框同时打开
  
  editMode.value = true;
  
  if (isBatchMode.value) {
    const pageIndexOffset = currentPage.value * pageSize.value;
    const actualIndex = pageIndexOffset + answerIndex;
    
    currentEditItem.value = {
      type: 'minorTitle',
      answerIndex: actualIndex,
      majorIndex,
      minorIndex
    };
    editTitle.value = batchAnswers[actualIndex].parsed[majorIndex].items[minorIndex].title;
  } else {
    currentEditItem.value = {
      type: 'minorTitle',
      majorIndex,
      minorIndex
    };
    editTitle.value = parsedAnswer.value[majorIndex].items[minorIndex].title;
  }
}

// 启动编辑内容模式
function editMinorContent(answerIndex, majorIndex, minorIndex) {
  if (editMode.value) return; // 防止多个编辑框同时打开
  
  editMode.value = true;
  
  if (isBatchMode.value) {
    const pageIndexOffset = currentPage.value * pageSize.value;
    const actualIndex = pageIndexOffset + answerIndex;
    
    currentEditItem.value = {
      type: 'minorContent',
      answerIndex: actualIndex,
      majorIndex,
      minorIndex
    };
    editContent.value = batchAnswers[actualIndex].parsed[majorIndex].items[minorIndex].content;
  } else {
    currentEditItem.value = {
      type: 'minorContent',
      majorIndex,
      minorIndex
    };
    editContent.value = parsedAnswer.value[majorIndex].items[minorIndex].content;
  }
}

// 保存编辑内容
function saveEdit() {
  if (!currentEditItem.value) return;
  
  const { type, answerIndex, majorIndex, minorIndex } = currentEditItem.value;
  
  if (isBatchMode.value) {
    if (type === 'majorTitle') {
      batchAnswers[answerIndex].parsed[majorIndex].title = editTitle.value;
    } else if (type === 'minorTitle') {
      batchAnswers[answerIndex].parsed[majorIndex].items[minorIndex].title = editTitle.value;
    } else if (type === 'minorContent') {
      batchAnswers[answerIndex].parsed[majorIndex].items[minorIndex].content = editContent.value;
    }
  } else {
    if (type === 'majorTitle') {
      parsedAnswer.value[majorIndex].title = editTitle.value;
    } else if (type === 'minorTitle') {
      parsedAnswer.value[majorIndex].items[minorIndex].title = editTitle.value;
    } else if (type === 'minorContent') {
      parsedAnswer.value[majorIndex].items[minorIndex].content = editContent.value;
    }
  }
  
  cancelEdit();
}

// 取消编辑
function cancelEdit() {
  editMode.value = false;
  currentEditItem.value = null;
  editTitle.value = '';
  editContent.value = '';
}

// 导出为JSON
function exportToJson() {
  let dataToExport = [];
  
  if (isBatchMode.value) {
    // 导出所有批量处理的数据
    dataToExport = batchAnswers.map(item => item.parsed);
  } else {
    // 只导出当前显示的数据
    dataToExport = [parsedAnswer.value];
  }
  
  const jsonString = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = isBatchMode.value ? 'batch-answers.json' : 'answer.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 监听答案解析状态变化，确保展开所有手风琴
watch(isParsed, (newValue) => {
  if (newValue) {
    // 当解析完成后，展开所有手风琴
    expandAllCurrentPage();
  }
});

// 当导航到新页面时自动展开所有手风琴
watch(currentPage, () => {
  expandAllCurrentPage();
});
</script>

<template>
  <div class="container">
    <h1 class="title">答案解析工具</h1>
    <p class="subtitle">将答案拆分为四级手风琴结构</p>

    <div v-if="!isParsed" class="input-section">
      <div class="button-group">
        <button @click="fillExample" class="btn secondary">填充示例</button>
        <label class="file-upload-btn">
          <input type="file" accept=".txt" @change="handleFileUpload" :disabled="fileLoading" />
          <span class="btn primary">{{ fileLoading ? '加载中...' : '上传答案文件' }}</span>
        </label>
        <a href="/example-answers.txt" download="example-answers.txt" class="btn secondary">下载示例文件</a>
      </div>
      
      <div class="or-divider">
        <span>或</span>
      </div>
      
      <textarea 
        v-model="answerText" 
        placeholder="请输入完整答案（格式如：一、...  1、... 等）" 
        rows="10"
        class="answer-input"
      ></textarea>
      
      <div class="button-group">
        <button @click="parseAnswer()" class="btn primary">解析答案</button>
      </div>
    </div>

    <div v-else class="result-section">
      <!-- 批处理模式导航 -->
      <div v-if="isBatchMode" class="batch-nav">
        <div class="nav-info">
          当前第 {{ currentPage + 1 }} 页（共 {{ totalPages }} 页），每页显示 {{ pageSize }} 个答案，总计 {{ batchAnswers.length }} 个答案
        </div>
        <div class="nav-controls">
          <button 
            @click="viewPreviousPage" 
            class="btn secondary nav-btn" 
            :disabled="currentPage === 0"
          >
            上一页
          </button>
          <button 
            @click="viewNextPage" 
            class="btn secondary nav-btn" 
            :disabled="currentPage === totalPages - 1"
          >
            下一页
          </button>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="control-panel">
        <div class="control-group">
          <button @click="expandAllCurrentPage" class="btn primary action-btn">展开全部</button>
          <button @click="collapseAll" class="btn secondary action-btn">折叠全部</button>
        </div>
        <div class="control-group">
          <button @click="exportToJson" class="btn primary action-btn">导出为JSON</button>
        </div>
      </div>
      
      <!-- 编辑模态框 -->
      <div v-if="editMode" class="edit-modal">
        <div class="edit-modal-content">
          <h3>{{ currentEditItem && currentEditItem.type.includes('Title') ? '编辑标题' : '编辑内容' }}</h3>
          
          <textarea 
            v-if="currentEditItem && currentEditItem.type === 'minorContent'"
            v-model="editContent" 
            class="edit-textarea"
            rows="5"
          ></textarea>
          
          <input 
            v-else
            type="text" 
            v-model="editTitle" 
            class="edit-input"
          />
          
          <div class="edit-buttons">
            <button @click="saveEdit" class="btn primary">保存</button>
            <button @click="cancelEdit" class="btn secondary">取消</button>
          </div>
        </div>
      </div>
      
      <!-- 多答案容器 -->
      <div class="multiple-answers">
        <div 
          v-for="(answer, answerIndex) in currentPageAnswers" 
          :key="`answer-${answer.index}`"
          class="answer-container"
        >
          <div class="answer-header">
            <h3 class="answer-title">答案 {{ answer.index }}</h3>
          </div>
          
          <div class="answers-grid">
            <div 
              v-for="(majorSection, majorIndex) in answer.parsed" 
              :key="`${answer.index}-${majorSection.id}`" 
              class="accordion-item major-section"
            >
              <div 
                class="accordion-header compact-header" 
                @click="toggleMajorSection(answerIndex, majorIndex)"
              >
                <span class="section-title">
                  {{ `${majorSection.number}、` }}
                  <span 
                    class="editable-text"
                    @click.stop="editMajorTitle(answerIndex, majorIndex)"
                    :title="'点击编辑'"
                  >
                    {{ majorSection.title }}
                  </span>
                </span>
                <span class="toggle-icon">{{ majorSection.isOpen ? '▼' : '▶' }}</span>
              </div>
              
              <!-- 小点（二级手风琴） -->
              <div v-if="majorSection.isOpen" class="accordion-content compact-content">
                <div 
                  v-for="(minorItem, minorIndex) in majorSection.items" 
                  :key="`${answer.index}-${minorItem.id}`" 
                  class="accordion-item minor-section"
                >
                  <div 
                    class="accordion-header minor-header compact-header" 
                    @click="toggleMinorSection(answerIndex, majorIndex, minorIndex)"
                  >
                    <span class="section-title">
                      {{ `${minorItem.number}、` }}
                      <span 
                        class="editable-text"
                        @click.stop="editMinorTitle(answerIndex, majorIndex, minorIndex)"
                        :title="'点击编辑'"
                      >
                        {{ minorItem.title }}
                      </span>
                    </span>
                    <span class="toggle-icon">{{ minorItem.isOpen ? '▼' : '▶' }}</span>
                  </div>
                  
                  <!-- 小点内容（三级手风琴） -->
                  <div v-if="minorItem.isOpen" class="accordion-content minor-content compact-content">
                    <p 
                      class="editable-content compact-text"
                      @click="editMinorContent(answerIndex, majorIndex, minorIndex)"
                      :title="'点击编辑'"
                    >
                      {{ minorItem.content }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="button-group">
        <button @click="resetApp" class="btn secondary">{{ isBatchMode ? '返回' : '重新输入' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.title {
  color: #333;
  text-align: center;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.input-section, .result-section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.answer-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 20px;
  resize: vertical;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 15px 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background-color: #4CAF50;
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #388e3c;
}

.secondary {
  background-color: #f1f1f1;
  color: #333;
}

.secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.accordion {
  margin-top: 20px;
}

.accordion-item {
  margin-bottom: 6px;
  border-radius: 4px;
  overflow: hidden;
}

.major-section {
  border: 1px solid #ddd;
  background-color: white;
}

.minor-section {
  border: 1px solid #eee;
  margin: 4px 0;
}

.accordion-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: #f5f5f5;
  transition: background-color 0.3s;
}

.compact-header {
  padding: 8px 12px;
  font-size: 14px;
}

.accordion-header:hover {
  background-color: #e9e9e9;
}

.minor-header {
  background-color: #f9f9f9;
  padding: 12px 15px;
}

.minor-header.compact-header {
  padding: 6px 12px;
}

.minor-header:hover {
  background-color: #f0f0f0;
}

.section-title {
  font-weight: bold;
}

.toggle-icon {
  font-size: 12px;
}

.accordion-content {
  padding: 15px;
  background-color: white;
}

.compact-content {
  padding: 8px;
}

.minor-content {
  padding: 12px;
  background-color: #fdfdfd;
  border-top: 1px solid #eee;
}

.minor-content.compact-content {
  padding: 6px 10px;
}

.compact-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

/* 文件上传样式 */
.file-upload-btn {
  position: relative;
  overflow: hidden;
  display: inline-block;
  cursor: pointer;
}

.file-upload-btn input[type="file"] {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 100%;
  min-height: 100%;
  font-size: 100px;
  text-align: right;
  filter: alpha(opacity=0);
  opacity: 0;
  outline: none;
  cursor: inherit;
  display: block;
}

/* 分隔线 */
.or-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 15px 0;
  color: #888;
}

.or-divider::before,
.or-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.or-divider span {
  padding: 0 10px;
}

/* 批处理导航 */
.batch-nav {
  background-color: #eaf7ea;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.nav-info {
  font-weight: bold;
  color: #333;
}

.nav-controls {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 8px 15px;
}

/* 控制面板 */
.control-panel {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
}

.control-group {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 15px;
  font-size: 14px;
}

/* 可编辑内容样式 */
.editable-text {
  border-bottom: 1px dashed #999;
  padding: 2px 0;
  cursor: text;
}

.editable-content {
  padding: 8px;
  border-radius: 4px;
  cursor: text;
  border: 1px dashed transparent;
  transition: all 0.2s;
}

.editable-content:hover {
  background-color: #f8f8f8;
  border-color: #ddd;
}

/* 编辑模态框 */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.edit-modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.edit-modal-content h3 {
  margin-top: 0;
  color: #333;
}

.edit-textarea,
.edit-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  margin-bottom: 15px;
}

.edit-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 多答案容器 */
.multiple-answers {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.answer-container {
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.answer-header {
  background-color: #f0f8ff;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
}

.answer-title {
  margin: 0;
  font-size: 16px;
  color: #333;
}

/* 多答案网格布局 */
.answers-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 15px;
}

@media (max-width: 600px) {
  .batch-nav,
  .control-panel {
    flex-direction: column;
  }
  
  .nav-controls,
  .control-group {
    margin-top: 10px;
  }
  
  .answers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
