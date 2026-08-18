const fs = require('fs');

let c = fs.readFileSync('src/App.vue', 'utf-8');

// Insert button
const targetButton = `                <button 
                  class="btn btn-primary" 
                  @click="handleReclusterPeople" 
                  :disabled="isClusteringPeople"
                  style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); cursor: pointer;"
                >
                  <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px;"></span>
                  <span v-else>🔄</span>
                  <span>{{ isClusteringPeople ? (faceScanProgress.total > 0 && faceScanProgress.done < faceScanProgress.total ? '提取人脸中 (' + faceScanProgress.done + '/' + faceScanProgress.total + ')' : '计算聚类中...') : '刷新聚类' }}</span>
                </button>
              </div>`;

const newButtonHTML = `                <div style="display: flex; gap: 8px;">
                  <button 
                    class="btn btn-primary" 
                    @click="handleReclusterPeople" 
                    :disabled="isClusteringPeople"
                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); cursor: pointer;"
                  >
                    <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px;"></span>
                    <span v-else>🔄</span>
                    <span>{{ isClusteringPeople ? (faceScanProgress.total > 0 && faceScanProgress.done < faceScanProgress.total ? '提取人脸中 (' + faceScanProgress.done + '/' + faceScanProgress.total + ')' : '计算聚类中...') : '刷新聚类' }}</span>
                  </button>
                  <button 
                    class="btn" 
                    @click="handleRecalculateFaces" 
                    :disabled="isClusteringPeople"
                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-primary); cursor: pointer;"
                  >
                    <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px; border-color: var(--text-primary); border-top-color: transparent;"></span>
                    <span v-else>♻️</span>
                    <span>强制重新提取</span>
                  </button>
                </div>
              </div>`;

c = c.replace(targetButton, newButtonHTML);


// Insert function
const targetFunc = `    } catch (e) {
      console.error('[People] Failed to load person clusters:', e);
    }
  }
}

async function handleReclusterPeople() {`;

const newFuncStr = `    } catch (e) {
      console.error('[People] Failed to load person clusters:', e);
    }
  }
}

async function handleRecalculateFaces() {
  if (!confirm('确定要清空所有人脸识别记录，并强制对全部图片重新进行人脸提取吗？\\n如果图片较多，可能需要几分钟时间。')) return;
  if (!hasApi || !window.api.recalculateAllFaces) return;
  
  isClusteringPeople.value = true;
  faceScanProgress.value = { done: 0, total: 0 };
  try {
    const clusters = await window.api.recalculateAllFaces();
    personClusters.value = clusters;
    if (clusters.length > 0) {
      selectPerson(clusters[0]);
    } else {
      selectedPerson.value = null;
    }
    alert('强制重新提取人脸完成！');
  } catch (e) {
    console.error('[People] Failed to recalculate faces:', e);
    alert('重新提取失败: ' + e.message);
  } finally {
    isClusteringPeople.value = false;
  }
}

async function handleReclusterPeople() {`;

c = c.replace(targetFunc, newFuncStr);

fs.writeFileSync('src/App.vue', c);
