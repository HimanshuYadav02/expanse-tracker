#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <map>
#include <cmath>
#include <iomanip>
#include <fstream>
#include <algorithm>

struct Transaction {
    std::string id;
    std::string title;
    std::string category;
    double amount;
    std::string date;
    std::string type;
};

struct CategoryMetrics {
    double sum = 0.0;
    double count = 0.0;
    double mean = 0.0;
    double stddev = 0.0;
    std::vector<double> values;
};

std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\n\r");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\n\r");
    return str.substr(first, (last - first + 1));
}

// Simple and robust parser for line-delimited or basic CSV/JSON formatted records
std::vector<Transaction> parseTransactionsFromStream(std::istream& in) {
    std::vector<Transaction> list;
    std::string line;

    while (std::getline(in, line)) {
        line = trim(line);
        if (line.empty() || line[0] == '#') continue;

        // Supported format: id|title|category|amount|date|type
        std::stringstream ss(line);
        std::string token;
        std::vector<std::string> parts;
        while (std::getline(ss, token, '|')) {
            parts.push_back(trim(token));
        }

        if (parts.size() >= 6) {
            Transaction t;
            t.id = parts[0];
            t.title = parts[1];
            t.category = parts[2];
            try {
                t.amount = std::stod(parts[3]);
            } catch (...) {
                continue;
            }
            t.date = parts[4];
            t.type = parts[5];
            list.push_back(t);
        }
    }
    return list;
}

int main(int argc, char* argv[]) {
    std::vector<Transaction> transactions;

    if (argc > 1) {
        std::ifstream file(argv[1]);
        if (file.is_open()) {
            transactions = parseTransactionsFromStream(file);
        } else {
            std::cerr << "{\"error\": \"Could not open input file: " << argv[1] << "\"}\n";
            return 1;
        }
    } else {
        transactions = parseTransactionsFromStream(std::cin);
    }

    if (transactions.empty()) {
        std::cout << "{\n"
                  << "  \"total_analyzed\": 0,\n"
                  << "  \"anomalies_detected\": 0,\n"
                  << "  \"anomalies\": [],\n"
                  << "  \"category_summary\": {}\n"
                  << "}\n";
        return 0;
    }

    std::map<std::string, CategoryMetrics> catStats;
    double totalExpense = 0.0;
    int expenseCount = 0;

    for (const auto& tx : transactions) {
        if (tx.type == "expense") {
            catStats[tx.category].sum += tx.amount;
            catStats[tx.category].count += 1.0;
            catStats[tx.category].values.push_back(tx.amount);
            totalExpense += tx.amount;
            expenseCount++;
        }
    }

    // Compute mean and sample standard deviation per category
    for (auto& pair : catStats) {
        CategoryMetrics& m = pair.second;
        if (m.count > 0) {
            m.mean = m.sum / m.count;
            double varianceSum = 0.0;
            for (double val : m.values) {
                varianceSum += (val - m.mean) * (val - m.mean);
            }
            m.stddev = (m.count > 1) ? std::sqrt(varianceSum / (m.count - 1)) : 0.0;
        }
    }

    // Identify anomalies (Z-Score >= 1.75 or value > 2x average when stddev is low)
    struct AnomalyReport {
        Transaction tx;
        double zScore;
        double categoryAvg;
        std::string riskLevel;
    };

    std::vector<AnomalyReport> anomalies;

    for (const auto& tx : transactions) {
        if (tx.type != "expense") continue;

        const CategoryMetrics& m = catStats[tx.category];
        double z = 0.0;
        if (m.stddev > 0.0001) {
            z = (tx.amount - m.mean) / m.stddev;
        }

        bool isAnomaly = false;
        std::string risk = "NORMAL";

        if (z >= 2.5 || (m.count >= 3 && tx.amount > m.mean * 2.8)) {
            isAnomaly = true;
            risk = "HIGH";
        } else if (z >= 1.75 || (m.count >= 3 && tx.amount > m.mean * 2.0)) {
            isAnomaly = true;
            risk = "MEDIUM";
        }

        if (isAnomaly) {
            anomalies.push_back({tx, z, m.mean, risk});
        }
    }

    // Print JSON output
    std::cout << "{\n";
    std::cout << "  \"engine\": \"C++ Statistical Anomaly Detector\",\n";
    std::cout << "  \"total_analyzed\": " << transactions.size() << ",\n";
    std::cout << "  \"total_expenses_amount\": " << std::fixed << std::setprecision(2) << totalExpense << ",\n";
    std::cout << "  \"anomalies_detected\": " << anomalies.size() << ",\n";
    std::cout << "  \"anomalies\": [\n";

    for (size_t i = 0; i < anomalies.size(); ++i) {
        const auto& a = anomalies[i];
        std::cout << "    {\n";
        std::cout << "      \"id\": \"" << a.tx.id << "\",\n";
        std::cout << "      \"title\": \"" << a.tx.title << "\",\n";
        std::cout << "      \"category\": \"" << a.tx.category << "\",\n";
        std::cout << "      \"amount\": " << a.tx.amount << ",\n";
        std::cout << "      \"category_avg\": " << a.categoryAvg << ",\n";
        std::cout << "      \"z_score\": " << a.zScore << ",\n";
        std::cout << "      \"risk\": \"" << a.riskLevel << "\",\n";
        std::cout << "      \"date\": \"" << a.tx.date << "\"\n";
        std::cout << "    }" << (i + 1 < anomalies.size() ? "," : "") << "\n";
    }

    std::cout << "  ],\n";
    std::cout << "  \"category_metrics\": {\n";

    size_t catIdx = 0;
    for (auto it = catStats.begin(); it != catStats.end(); ++it, ++catIdx) {
        std::cout << "    \"" << it->first << "\": {\n";
        std::cout << "      \"count\": " << (int)it->second.count << ",\n";
        std::cout << "      \"mean\": " << it->second.mean << ",\n";
        std::cout << "      \"stddev\": " << it->second.stddev << ",\n";
        std::cout << "      \"total\": " << it->second.sum << "\n";
        std::cout << "    }" << (catIdx + 1 < catStats.size() ? "," : "") << "\n";
    }

    std::cout << "  }\n";
    std::cout << "}\n";

    return 0;
}
