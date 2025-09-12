class HouseholdBudgetApp {
    constructor() {
        this.expenses = this.loadExpenses();
        this.categoryNames = {
            food: '食費',
            utilities: '光熱費',
            transportation: '交通費',
            entertainment: '娯楽費',
            healthcare: '医療費',
            other: 'その他'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setTodayDate();
        this.updateCharts();
        this.updateSummary();
        this.updateRecentExpenses();
    }

    setupEventListeners() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e);
        });
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    addExpense() {
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const amount = parseInt(document.getElementById('amount').value);
        const description = document.getElementById('description').value;

        const expense = {
            id: Date.now(),
            date,
            category,
            amount,
            description
        };

        this.expenses.push(expense);
        this.saveExpenses();
        this.updateCharts();
        this.updateSummary();
        this.updateRecentExpenses();
        
        // フォームをリセット
        document.getElementById('expenseForm').reset();
        this.setTodayDate();

        // 成功メッセージ（簡易）
        const btn = document.querySelector('.btn');
        const originalText = btn.textContent;
        btn.textContent = '記録完了！';
        btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        }, 1000);
    }

    loadExpenses() {
        const stored = localStorage.getItem('householdExpenses');
        return stored ? JSON.parse(stored) : [];
    }

    saveExpenses() {
        localStorage.setItem('householdExpenses', JSON.stringify(this.expenses));
    }

    getMonthlyData() {
        const monthlyData = {};
        
        this.expenses.forEach(expense => {
            const month = expense.date.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = 0;
            }
            monthlyData[month] += expense.amount;
        });

        return monthlyData;
    }

    getCategoryData() {
        const categoryData = {};
        
        this.expenses.forEach(expense => {
            if (!categoryData[expense.category]) {
                categoryData[expense.category] = 0;
            }
            categoryData[expense.category] += expense.amount;
        });

        return categoryData;
    }

    updateCharts() {
        this.updateMonthlyChart();
        this.updateCategoryChart();
    }

    updateMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const monthlyData = this.getMonthlyData();
        
        // 既存のチャートがあれば破棄
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        const sortedMonths = Object.keys(monthlyData).sort();
        const amounts = sortedMonths.map(month => monthlyData[month]);

        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: [{
                    label: '月別支出',
                    data: amounts,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    updateCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categoryData = this.getCategoryData();
        
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', 
            '#96ceb4', '#feca57', '#a55eea'
        ];

        const labels = Object.keys(categoryData).map(key => this.categoryNames[key]);
        const data = Object.values(categoryData);

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateSummary() {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

        const thisMonthAmount = this.expenses
            .filter(exp => exp.date.startsWith(thisMonth))
            .reduce((sum, exp) => sum + exp.amount, 0);

        const lastMonthAmount = this.expenses
            .filter(exp => exp.date.startsWith(lastMonth))
            .reduce((sum, exp) => sum + exp.amount, 0);

        const totalAmount = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const monthlyData = this.getMonthlyData();
        const averageAmount = Object.keys(monthlyData).length > 0 
            ? totalAmount / Object.keys(monthlyData).length 
            : 0;

        document.getElementById('thisMonth').textContent = `¥${thisMonthAmount.toLocaleString()}`;
        document.getElementById('lastMonth').textContent = `¥${lastMonthAmount.toLocaleString()}`;
        document.getElementById('average').textContent = `¥${Math.round(averageAmount).toLocaleString()}`;
        document.getElementById('total').textContent = `¥${totalAmount.toLocaleString()}`;
    }

    updateRecentExpenses() {
        const recentExpenses = this.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        const container = document.getElementById('recentExpenses');
        container.innerHTML = '';

        if (recentExpenses.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">まだ支出が記録されていません</p>';
            return;
        }

        recentExpenses.forEach(expense => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <div class="expense-info">
                    <span class="expense-category category-${expense.category}">
                        ${this.categoryNames[expense.category]}
                    </span>
                    <div>
                        <div style="font-weight: 600;">${expense.description || '記載なし'}</div>
                        <div style="font-size: 0.9rem; color: #718096;">${expense.date}</div>
                    </div>
                </div>
                <div style="font-weight: 700; color: #2d3748;">
                    ¥${expense.amount.toLocaleString()}
                </div>
            `;
            container.appendChild(div);
        });
    }

    exportData() {
        const data = {
            expenses: this.expenses,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `household_budget_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.expenses && Array.isArray(data.expenses)) {
                    this.expenses = data.expenses;
                    this.saveExpenses();
                    this.updateCharts();
                    this.updateSummary();
                    this.updateRecentExpenses();
                    alert('データのインポートが完了しました！');
                } else {
                    alert('無効なファイル形式です。');
                }
            } catch (error) {
                alert('ファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    }
}

// アプリを初期化
window.addEventListener('DOMContentLoaded', () => {
    new HouseholdBudgetApp();
});