import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class BudgetAuditor {

    static class TransactionRecord {
        String id;
        String title;
        String category;
        double amount;
        String date;
        String type;

        public TransactionRecord(String id, String title, String category, double amount, String date, String type) {
            this.id = id;
            this.title = title;
            this.category = category;
            this.amount = amount;
            this.date = date;
            this.type = type;
        }
    }

    public static void main(String[] args) {
        List<TransactionRecord> transactions = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                String[] parts = line.split("\\|");
                if (parts.length >= 6) {
                    try {
                        transactions.add(new TransactionRecord(
                            parts[0].trim(),
                            parts[1].trim(),
                            parts[2].trim(),
                            Double.parseDouble(parts[3].trim()),
                            parts[4].trim(),
                            parts[5].trim()
                        ));
                    } catch (NumberFormatException ignored) {}
                }
            }
        } catch (IOException e) {
            System.err.println("{\"error\": \"" + e.getMessage() + "\"}");
            System.exit(1);
        }

        double totalIncome = 0.0;
        double totalExpense = 0.0;
        Map<String, Double> categoryExpenses = new HashMap<>();

        for (TransactionRecord tx : transactions) {
            if ("income".equalsIgnoreCase(tx.type)) {
                totalIncome += tx.amount;
            } else if ("expense".equalsIgnoreCase(tx.type)) {
                totalExpense += tx.amount;
                categoryExpenses.put(tx.category, categoryExpenses.getOrDefault(tx.category, 0.0) + tx.amount);
            }
        }

        double netSavings = totalIncome - totalExpense;
        double savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100.0 : 0.0;
        String healthStatus = "HEALTHY";
        if (savingsRate < 10.0) healthStatus = "CRITICAL";
        else if (savingsRate < 25.0) healthStatus = "MODERATE";

        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"engine\": \"Java Enterprise Financial Auditor\",\n");
        sb.append("  \"total_records\": ").append(transactions.size()).append(",\n");
        sb.append("  \"total_income\": ").append(String.format(Locale.US, "%.2f", totalIncome)).append(",\n");
        sb.append("  \"total_expense\": ").append(String.format(Locale.US, "%.2f", totalExpense)).append(",\n");
        sb.append("  \"net_savings\": ").append(String.format(Locale.US, "%.2f", netSavings)).append(",\n");
        sb.append("  \"savings_rate_percent\": ").append(String.format(Locale.US, "%.1f", savingsRate)).append(",\n");
        sb.append("  \"financial_health_rating\": \"").append(healthStatus).append("\",\n");
        sb.append("  \"top_expense_categories\": [\n");

        List<Map.Entry<String, Double>> sortedCats = new ArrayList<>(categoryExpenses.entrySet());
        sortedCats.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        for (int i = 0; i < sortedCats.size(); i++) {
            Map.Entry<String, Double> entry = sortedCats.get(i);
            double share = totalExpense > 0 ? (entry.getValue() / totalExpense) * 100.0 : 0.0;
            sb.append("    {\n");
            sb.append("      \"category\": \"").append(entry.getKey()).append("\",\n");
            sb.append("      \"amount\": ").append(String.format(Locale.US, "%.2f", entry.getValue())).append(",\n");
            sb.append("      \"expense_share_percent\": ").append(String.format(Locale.US, "%.1f", share)).append("\n");
            sb.append("    }").append(i + 1 < sortedCats.size() ? "," : "").append("\n");
        }

        sb.append("  ]\n");
        sb.append("}\n");

        System.out.print(sb);
    }
}
